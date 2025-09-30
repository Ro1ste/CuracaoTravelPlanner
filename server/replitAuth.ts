import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "./storage";

// Use dev mode by default in development unless explicitly disabled
const DEV_MODE = process.env.NODE_ENV === 'development' && process.env.USE_DEV_STORAGE !== 'false';

if (!DEV_MODE && !process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Require SESSION_SECRET in production
  if (!DEV_MODE && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required in production");
  }
  
  let sessionStore;
  if (DEV_MODE) {
    const MemStore = MemoryStore(session);
    sessionStore = new MemStore({
      checkPeriod: sessionTtl,
    });
  } else {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !DEV_MODE,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const email = claims["email"] || "";
  await storage.upsertUser({
    id: claims["sub"],
    email: email,
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    isAdmin: email.toLowerCase().includes("admin"),
  });
}

async function seedDevData() {
  // Seed some sample tasks for testing
  const tasks = await storage.getAllTasks();
  if (tasks.length === 0) {
    await storage.createTask({
      title: "Morning Walk",
      description: "Take a 30-minute walk to start your day",
      pointsReward: 50,
      caloriesBurned: 100,
      videoUrl: null,
      date: new Date(),
    });
    
    await storage.createTask({
      title: "Desk Stretches",
      description: "5-minute stretching routine at your desk",
      pointsReward: 25,
      caloriesBurned: 30,
      videoUrl: null,
      date: new Date(),
    });

    await storage.createTask({
      title: "Team Fitness Challenge",
      description: "Participate in team fitness activities",
      pointsReward: 100,
      caloriesBurned: 200,
      videoUrl: null,
      date: new Date(),
    });

    // Create sample event
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    
    await storage.createEvent({
      title: "Corporate Wellness Summit 2024",
      description: "Join us for an inspiring day of wellness workshops, networking, and team building activities. Experience keynote speakers, interactive sessions, and connect with wellness professionals.",
      eventDate: futureDate,
      brandingColor: "#ff6600",
    });
    
    console.log("✅ Dev seed data: Created sample tasks and event");
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (DEV_MODE) {
    // Seed initial dev data
    await seedDevData();
    
    // Dev mode - simple role-based login
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    app.get("/api/dev/login", async (req, res) => {
      const role = req.query.role as string;
      const isAdmin = role === 'admin';
      const userId = isAdmin ? 'dev-admin-user' : 'dev-company-user';
      const email = isAdmin ? 'admin@dev.local' : 'company@dev.local';
      
      // Upsert dev user
      await storage.upsertUser({
        id: userId,
        email: email,
        firstName: isAdmin ? 'Admin' : 'Company',
        lastName: 'User',
        profileImageUrl: null,
        isAdmin: isAdmin,
      });

      // Create company for company user if doesn't exist
      if (!isAdmin) {
        const existingCompany = await storage.getCompanyByUserId(userId);
        if (!existingCompany) {
          await storage.createCompany({
            name: "Dev Test Company",
            contactPersonName: "Company User",
            email: "company@dev.local",
            phone: "+1234567890",
            teamSize: 10,
            logoUrl: null,
            brandingColor: "#ff6600",
            userId: userId,
          });
        }
      }

      // Set session
      const devUser = {
        claims: { sub: userId },
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week
      };
      
      req.login(devUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.redirect('/');
      });
    });

    // Demo login - accepts any username/password
    app.post("/api/demo/login", async (req, res) => {
      const { username, password, role } = req.body;
      
      if (!username || !password || !role) {
        return res.status(400).json({ message: "Username, password, and role required" });
      }

      const isAdmin = role === 'admin';
      // Create a unique user ID based on username
      const userId = `demo-${username}-${isAdmin ? 'admin' : 'company'}`;
      const email = `${username}@demo.local`;
      
      // Upsert demo user
      await storage.upsertUser({
        id: userId,
        email: email,
        firstName: username,
        lastName: isAdmin ? 'Admin' : 'User',
        profileImageUrl: null,
        isAdmin: isAdmin,
      });

      // Create company for company user if doesn't exist
      if (!isAdmin) {
        const existingCompany = await storage.getCompanyByUserId(userId);
        if (!existingCompany) {
          await storage.createCompany({
            name: `${username}'s Company`,
            contactPersonName: username,
            email: email,
            phone: "+1234567890",
            teamSize: 10,
            logoUrl: null,
            brandingColor: "#ff6600",
            userId: userId,
          });
        }
      }

      // Set session
      const demoUser = {
        claims: { sub: userId },
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week
      };
      
      req.login(demoUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ success: true });
      });
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect('/');
      });
    });
  } else {
    // Production - Replit Auth
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    for (const domain of process.env
      .REPLIT_DOMAINS!.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    app.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Dev mode - simple authentication check
  if (DEV_MODE) {
    if (user?.claims?.sub) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Production mode - full OAuth flow with token refresh
  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};