--
-- PostgreSQL database dump
--

\restrict 4XWjIfvUtScFWpJTIvk3IGzSWDqtGLxb8kPyeqJxrCEGW6y7p4xIndsDSbnwl8M

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _system; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA _system;


ALTER SCHEMA _system OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: replit_database_migrations_v1; Type: TABLE; Schema: _system; Owner: neondb_owner
--

CREATE TABLE _system.replit_database_migrations_v1 (
    id bigint NOT NULL,
    build_id text NOT NULL,
    deployment_id text NOT NULL,
    statement_count bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE _system.replit_database_migrations_v1 OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE; Schema: _system; Owner: neondb_owner
--

CREATE SEQUENCE _system.replit_database_migrations_v1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE OWNED BY; Schema: _system; Owner: neondb_owner
--

ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNED BY _system.replit_database_migrations_v1.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    contact_person_name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying NOT NULL,
    team_size integer DEFAULT 1,
    logo_url character varying,
    branding_color character varying DEFAULT '#211100'::character varying,
    total_points integer DEFAULT 0,
    total_calories_burned integer DEFAULT 0,
    daily_goal integer DEFAULT 100,
    user_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.companies OWNER TO neondb_owner;

--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_registrations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    qr_code character varying,
    checked_in boolean DEFAULT false,
    checked_in_at timestamp without time zone,
    registered_at timestamp without time zone DEFAULT now(),
    approved_at timestamp without time zone,
    company_name character varying,
    qr_code_payload text,
    qr_code_issued_at timestamp without time zone
);


ALTER TABLE public.event_registrations OWNER TO neondb_owner;

--
-- Name: events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    description text,
    event_date timestamp without time zone NOT NULL,
    branding_color character varying DEFAULT '#211100'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    email_subject character varying,
    email_body_text text,
    youtube_url character varying,
    short_code character varying
);


ALTER TABLE public.events OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: task_proofs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.task_proofs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    task_id character varying NOT NULL,
    company_id character varying NOT NULL,
    content_type character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    admin_notes text,
    submitted_at timestamp without time zone DEFAULT now(),
    reviewed_at timestamp without time zone,
    content_urls text[]
);


ALTER TABLE public.task_proofs OWNER TO neondb_owner;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tasks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    description text,
    points_reward integer DEFAULT 10,
    calories_burned integer DEFAULT 50,
    date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    youtube_url character varying
);


ALTER TABLE public.tasks OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    is_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    password character varying
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1 id; Type: DEFAULT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1 ALTER COLUMN id SET DEFAULT nextval('_system.replit_database_migrations_v1_id_seq'::regclass);


--
-- Data for Name: replit_database_migrations_v1; Type: TABLE DATA; Schema: _system; Owner: neondb_owner
--

COPY _system.replit_database_migrations_v1 (id, build_id, deployment_id, statement_count, applied_at) FROM stdin;
1	7a8966e0-eff8-4b05-889b-5e8a22368eb6	9738021c-7b25-44c5-8376-3bd899b8113d	5	2025-09-30 19:52:07.028159+00
2	cde05fd4-604f-4708-916a-43b698050587	9738021c-7b25-44c5-8376-3bd899b8113d	3	2025-10-01 02:29:17.977395+00
3	177a9d39-280b-4476-803c-9e4efd3cf704	9738021c-7b25-44c5-8376-3bd899b8113d	2	2025-10-01 07:32:50.887208+00
4	caa463df-9ed7-48a0-b3e9-9c82005633bf	9738021c-7b25-44c5-8376-3bd899b8113d	4	2025-10-02 10:47:47.083314+00
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.companies (id, name, contact_person_name, email, phone, team_size, logo_url, branding_color, total_points, total_calories_burned, daily_goal, user_id, created_at, updated_at) FROM stdin;
96a30675-8bc1-4766-ad2e-ddb49fec7201	Hashers	Hassaan	i222434@nu.edu.pk	+923144685510	1	\N	#211100	0	0	100	C6t_il1kk66QwoaZI7L4z	2025-10-01 11:55:51.734659	2025-10-01 11:55:51.734659
3db33900-2ad3-48d0-836d-1475ade93276	Test Company	Test User	test@example.com	+1234567890	1	\N	#211100	0	0	100	HJiyOqgKX1dhWPr4yMtmd	2025-10-02 10:34:55.942676	2025-10-02 10:34:55.942676
8fb384c0-e4f3-40d8-8587-0d1462943ead	Admin Company	Admin User	admin@example.com	+1234567890	1	\N	#211100	0	0	100	nmYO1mnjnWoEFTMkwyqh7	2025-10-02 10:35:42.123547	2025-10-02 10:35:42.123547
13079d64-2ca6-400a-85b6-1c9b2c9fc61e	Test Company	John Doe	company@example.com	+1234567890	1	\N	#211100	0	0	100	I7w4K2BOY-sekPVcFmpZf	2025-10-02 11:34:52.334071	2025-10-02 11:34:52.334071
49761448-cadd-4749-ad0d-1eee63979025	Questventure	Maria Santos	info@velitt.com	+59995215755	1	\N	#211100	0	0	100	OsW-7ssLQDlHVmUBuJTab	2025-10-02 15:57:55.427356	2025-10-02 15:57:55.427356
4d8554d9-6dd8-4a05-b27b-5b2a1819d7d1	EISW Test Co	Test User	info@curacaointernationalsportsweek.com	1234567890	10	\N	#211100	0	0	100	6e770c08-3887-44a6-bda7-1c43d128b911	2025-10-06 10:45:36.492012	2025-10-06 10:45:36.492012
5618683f-acea-4666-8da2-2f22634ecfb3	Test Company	Test User	testcompany@example.com	+1234567890	1	\N	#211100	0	0	100	7gRssIJR39cMdluOuqomF	2025-10-08 22:20:59.425612	2025-10-08 22:20:59.425612
1333af97-5874-4597-9ba6-bff85aac308a	Another Company	Jane Smith	company2@example.com	+1234567891	1	\N	#211100	0	0	100	klCUpuezw3aX-lovnDFxU	2025-10-08 22:21:03.973671	2025-10-08 22:21:03.973671
2a8213da-f728-4a1e-bdd4-419621530660	Tech Corp	Bob Johnson	company3@example.com	+1234567892	1	\N	#211100	210	3000	100	-_ukS9sGNGFcq_ECk9adb	2025-10-08 22:21:08.715105	2025-10-08 23:03:58.26
14a36f2b-9387-4d45-b8b5-eb3536ee3ee0	Roen	Trinidad 	info@velittexperience.com	+59995215755	1	\N	#211100	10100	5007	100	M28aCeyQ1tdCzqz0aIKBw	2025-10-01 10:18:38.772012	2025-10-18 13:31:50.655
fd7d6441-05e3-423f-9f45-b1b08d95b3f9	asdsah	hsahashd	i222328@nu.edu.pk	+9241231241243	1	\N	#211100	0	0	100	8EJl9jRn8ql14G3MeEZo8	2025-10-18 13:34:20.220408	2025-10-18 13:34:20.220408
\.


--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.event_registrations (id, event_id, first_name, last_name, email, phone, status, qr_code, checked_in, checked_in_at, registered_at, approved_at, company_name, qr_code_payload, qr_code_issued_at) FROM stdin;
34e2ee29-b350-4f7b-9aed-4a2f94774baf	e6440dcc-456a-47cd-a9d0-4e01e65ef14f	Email	Test	hassanejaz400@gmail.com	123	approved	\N	f	\N	2025-10-06 11:07:11.969614	2025-10-06 11:07:27.13	EISW	\N	\N
38f6d831-db91-46c7-a325-4069fec2a289	f8098199-d0c2-4433-abb4-4dff82acb6a6	Marian  	Zimmerman 	r.j.trinidad@live.nl	+5999 5252629 	approved	\N	f	\N	2025-10-07 17:23:50.772132	2025-10-08 17:51:19.74	Simba 	\N	\N
0210beb2-6a69-44f1-9330-cf7fd7c3b308	f8098199-d0c2-4433-abb4-4dff82acb6a6	John	Doe	john.doe@example.com	+1234567890	pending	\N	f	\N	2025-10-08 21:58:17.553258	\N	Test Company	\N	\N
a8251008-9714-45f4-88be-c92c3a5539c7	f8098199-d0c2-4433-abb4-4dff82acb6a6	Jane	Smith	jane.smith@example.com	+1234567891	pending	\N	f	\N	2025-10-08 21:58:25.860925	\N	Another Company	\N	\N
e0c63178-048d-458d-a967-70b31117db70	f8098199-d0c2-4433-abb4-4dff82acb6a6	Bob	Johnson	bob.johnson@example.com	+1234567892	pending	\N	f	\N	2025-10-08 21:58:28.940217	\N	Tech Corp	\N	\N
eadb7467-169e-44d0-bb04-f8c939d71e78	f662a5d1-4d0b-46dc-9784-d2e2264af7e5	Hassaan	Ejaz	hassanejaz400@gmail.com	+923144685510	pending	\N	f	\N	2025-10-08 22:21:30.986229	\N	Hashers	\N	\N
6e9da3d0-c61a-4f61-8212-2dca376c85e9	f8098199-d0c2-4433-abb4-4dff82acb6a6	ashdahsd	hsahdahsdhas	company3@example.com	+2131241231	approved	\N	f	\N	2025-10-08 22:25:09.726404	2025-10-08 22:26:18.675	Hashers	\N	\N
f9ec442d-4c18-4626-9239-af9d9acfad20	f8098199-d0c2-4433-abb4-4dff82acb6a6	Marian  	Zimmerman 	r.j.trinidad@live.nl	+5999 5252629 	approved	\N	f	\N	2025-10-09 14:03:36.678891	2025-10-09 14:04:52.683	Simba  	\N	\N
b344bafb-df8c-483a-8208-9bfbde5b4692	e6440dcc-456a-47cd-a9d0-4e01e65ef14f	BHey	HTer	hassanejaz400@gmail.com	+923144685510	approved	\N	f	\N	2025-10-06 11:06:34.1944	2025-10-09 14:27:22.064	Hashers	\N	\N
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.events (id, title, description, event_date, branding_color, is_active, created_at, email_subject, email_body_text, youtube_url, short_code) FROM stdin;
e6440dcc-456a-47cd-a9d0-4e01e65ef14f	Corporate Challenge Kickoff	\N	2025-10-15 14:00:00	#211100	t	2025-10-06 10:42:52.345701	\N	\N	\N	EQD_55
f662a5d1-4d0b-46dc-9784-d2e2264af7e5	Yesasd	Noasdsadasdas	2025-10-08 11:04:00	#ff6600	t	2025-10-06 11:04:58.142584	Hey	HAsdad	\N	HKTEJ1
f8098199-d0c2-4433-abb4-4dff82acb6a6	Curacao International Sportsweek 2025	test taggagfaafgajkahhsdsad	2025-10-17 13:20:00	#ff6600	t	2025-10-07 17:22:20.983896	Curacao International SPortsweek	Informeel en vriendelijk:\n\nBedankt voor je e-mail! We zijn ontzettend blij om met jou samen te gaan werken en kijken ernaar uit om samen mooie dingen te realiseren.\n\nFormeler (voor zakelijke correspondentie):\n\nHartelijk dank voor uw e-mail. Wij zijn zeer verheugd om met u samen te werken en kijken uit naar een succesvolle samenwerking.\n\nNeutraal en professioneel (geschikt voor de meeste situaties):\n\nBedankt voor je e-mail. We zijn erg blij met de samenwerking en kijken uit naar wat we samen kunnen bereiken.	https://www.youtube.com/watch?v=KlnhhKUUpFk	LUCMEG
e1e5cae0-46a1-4063-8b65-efa9c564a941	test dcdc	test etstetstetstetste	2025-10-10 10:01:00	#ff6600	t	2025-10-09 14:01:43.723632	Curacao International SPortsweek	test	https://www.youtube.com/watch?v=KlnhhKUUpFk	X4NJAW
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
UkzucQI74D1T1SHOo7YPP-7f-mMbgv6n	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-25T13:34:26.553Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "8EJl9jRn8ql14G3MeEZo8", "email": "i222328@nu.edu.pk", "claims": {"sub": "8EJl9jRn8ql14G3MeEZo8"}, "expires_at": 1761399266}}}	2025-10-25 13:34:39
U6c2icsdCH7eB1ZoG7nM1VigkODZBSl2	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-22T13:33:26.091Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-22 13:33:27
\.


--
-- Data for Name: task_proofs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.task_proofs (id, task_id, company_id, content_type, status, admin_notes, submitted_at, reviewed_at, content_urls) FROM stdin;
9be0d65e-51cf-4e16-93d9-0cfc2cdec7c9	83666e76-9bc3-4abd-8015-670e9c0aae86	2a8213da-f728-4a1e-bdd4-419621530660	image	approved		2025-10-08 22:44:40.272048	2025-10-08 22:47:41.374	{proofs/1759963458854-r5cslfu6no.jpg,proofs/1759963459747-4nblcp7eifd.jpg,proofs/1759963460459-ahiuqhvwf6n.jpg,proofs/1759963461146-1urvdpqv0it.jpg,proofs/1759963461792-8y04jzhsevh.png,proofs/1759963462507-ei5vp9phgq.jpg}
f919a49b-50db-4b4a-a5f8-ef646eb83d4b	83666e76-9bc3-4abd-8015-670e9c0aae86	2a8213da-f728-4a1e-bdd4-419621530660	image	approved		2025-10-08 22:52:44.185888	2025-10-08 23:03:58.137	{https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1759963946560-cp1fuoogo1b.png,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1759963949123-9wtkw768syl.jpg,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1759963949834-uaeip1ojcs.jpeg,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1759963950551-hqymqpint1.png,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1759963951370-kiqureyryte.png,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1759963952086-b4n9qjsbxcu.png}
8feabc78-74ef-4952-9282-c30cc24b9f27	83666e76-9bc3-4abd-8015-670e9c0aae86	2a8213da-f728-4a1e-bdd4-419621530660	image	pending	\N	2025-10-10 15:58:23.680027	\N	{https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760111884753-swdfwm97ran.png,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760111886834-tgldihmd2r.png,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760111889146-118adrnajjv.jpg,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760111890155-ezxzdvo7vub.jpeg,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760111890874-xgrclv2pgyn.jpeg,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760111891540-pvzu7jg4tc.png}
bcf65623-b9e3-4812-b881-e1c714e8469b	90d4c001-71b8-4d59-904a-dd5331e27ffb	14a36f2b-9387-4d45-b8b5-eb3536ee3ee0	image	approved	asfsadasdadsad	2025-10-09 14:52:20.289863	2025-10-18 13:31:50.54	{https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760021469643-fuf4djwgn95.jpeg,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760021488505-19tm9imznj3.JPG,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760021496637-k1btdnyd5ep.JPG,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760021503357-xnlnpp6dpa.jpg,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760021511547-xm8axtp34y.jpg,https://bdfyyeuucanzdziikdma.supabase.co/storage/v1/object/public/proof-uploads/proofs/1760021511547-xm8axtp34y.jpg}
fbf8a608-f663-4e50-bf62-85b1965366a4	b7d10174-5885-4cfc-ad4c-6fd0c72ddf19	fd7d6441-05e3-423f-9f45-b1b08d95b3f9	image	pending	\N	2025-10-18 13:55:35.310427	\N	{https://d7zuhbdh1qtwa.cloudfront.net/uploads/1d43ce8e-414b-4918-be4b-f50da2c6fdf7,https://d7zuhbdh1qtwa.cloudfront.net/uploads/26bb0cb3-7e65-4b84-9774-04c64f55f6e9,https://d7zuhbdh1qtwa.cloudfront.net/uploads/38b9c9ef-1835-4b4c-b6f6-b14fe5e5537f,https://d7zuhbdh1qtwa.cloudfront.net/uploads/40f6f66a-639f-4f10-9ed6-e8e8b02b4fc6,https://d7zuhbdh1qtwa.cloudfront.net/uploads/6111ecc8-510b-436c-a628-eda33f6d2407,https://d7zuhbdh1qtwa.cloudfront.net/uploads/9e726409-6319-43e1-b6c1-b8b8a16c0972}
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tasks (id, title, description, points_reward, calories_burned, date, created_at, youtube_url) FROM stdin;
83666e76-9bc3-4abd-8015-670e9c0aae86	jump and Jump	Jumping Jacks: A full-body cardio exercise where you jump while spreading your legs and raising your arms overhead, then return to the starting position. They increase heart rate, burn calories, and improve endurance.\n\nPlanks: A core-strengthening exercise where you hold your body straight in a push-up position, resting on your forearms and toes. They build core stability, strengthen abs, back, and shoulders, and improve posture.	105	1500	2025-10-02 15:56:35.252822	2025-10-02 15:56:35.252822	https://www.youtube.com/watch?v=4l8ERXukrkA
90d4c001-71b8-4d59-904a-dd5331e27ffb	beweging whja	svssgsfgsdfsfsd	10100	5007	2025-10-08 17:49:28.211131	2025-10-08 17:49:28.211131	https://www.youtube.com/watch?v= KlnhhKUUpFk
b7d10174-5885-4cfc-ad4c-6fd0c72ddf19	Run	Run like a goat	2010	500	2025-10-15 00:16:29.031301	2025-10-15 00:16:29.031301	
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, is_admin, created_at, updated_at, password) FROM stdin;
HJiyOqgKX1dhWPr4yMtmd	test@example.com	Test	User	\N	f	2025-10-02 10:34:55.620305	2025-10-02 10:34:55.620305	$2b$10$0.pV7RFdoHIljmi/G9NCPu6qPuqpS3a.YFqPg.3OrWbJXMGyB.55a
nmYO1mnjnWoEFTMkwyqh7	admin@example.com	Admin	User	\N	f	2025-10-02 10:35:41.279731	2025-10-02 10:35:41.279731	$2b$10$d77SebkT54G/cxlgeWsfIeHxbPmI00z5Y1FXZlvGJSWP4t4goKPj2
0ef90af0-504e-4515-9885-4b02354e00a2	superadmin@example.com	Super	Admin	\N	t	2025-10-02 10:36:19.698044	2025-10-02 10:36:19.698044	$2b$10$m8snb8c2eeXuo2h4IXhFjO9neg5jOR81yDMl5CrACbs8atQlc76pG
48095560	r.j.trinidad@live.nl	Roen	Trinidad	\N	f	2025-09-30 15:50:34.530728	2025-10-02 11:05:52.81	\N
23713454	hassanejaz400@gmail.com	MasterOz	\N	\N	f	2025-09-30 19:50:41.235056	2025-10-02 11:22:19.614	\N
I7w4K2BOY-sekPVcFmpZf	company@example.com	John	Doe	\N	f	2025-10-02 11:34:52.052422	2025-10-02 11:34:52.052422	$2b$10$0z68v4TsQdMdTlYC53vCSOMwrZ/asst0JfR789GQuK9M8Nt6YYIAa
24a68ec8-7391-415a-bed1-bf9ad74b8918	sportsupport@fddk.cw	Marian	Zimmerman	\N	t	2025-10-02 15:50:43.9909	2025-10-02 15:50:43.9909	$2b$10$Z1MYA.rU0Ge8/vjs0kW6P.W2nJR7NYSnfHWwouxmxNT9Qgr.LKvRG
OsW-7ssLQDlHVmUBuJTab	info@velitt.com	Maria	Santos	\N	f	2025-10-02 15:57:55.384396	2025-10-02 15:57:55.384396	$2b$10$6e/Rts8gCcDyVv7POp2H3eFbhhd96x662jjqsaDFtMcuSYvxAeeAi
6e770c08-3887-44a6-bda7-1c43d128b911	info@curacaointernationalsportsweek.com	Test	User	\N	f	2025-10-06 03:58:36.408559	2025-10-06 03:58:36.408559	$2b$10$tMewRaP80cU2tkzql/gO8.DBgGjl3kcI1qHA0nbk/0seLrVM8I/uW
1ef0f0cf-f27b-4076-89a1-f61e3ffe87af	{"email":"admin@curacaointernationalsportsweek.com","password":"Admin2024!","firstName":"Admin","lastName":"User"}	\N	\N	\N	t	2025-10-06 04:07:30.682169	2025-10-06 04:07:30.682169	\N
9ffe0dfb-2197-4b61-b7c9-26b0d784551a	admin@curacaointernationalsportsweek.com	Admin	User	\N	t	2025-10-06 04:22:53.5762	2025-10-06 04:22:53.5762	$2b$10$slvw1lzFrBG8gMJvqlugB.q78xpSuPPPiizRteAZA7xO/byKpiAgO
M28aCeyQ1tdCzqz0aIKBw	info@velittexperience.com	Trinidad		\N	f	2025-10-01 10:18:38.732161	2025-10-07 17:31:31.027	$2b$10$PMbMK3u/yyBVImT0IaiBguAyERtHRo5ikNIWmucpKlZnwo/l4pAoK
7gRssIJR39cMdluOuqomF	testcompany@example.com	Test	User	\N	f	2025-10-08 22:20:59.183858	2025-10-08 22:20:59.183858	$2b$10$ad.sPGd6ckeVgnMQmFce3eZWsPD7QTBkU22rL9wGcues44j4oCdeS
klCUpuezw3aX-lovnDFxU	company2@example.com	Jane	Smith	\N	f	2025-10-08 22:21:03.742609	2025-10-08 22:21:03.742609	$2b$10$lXtSz/7ShVRCMpT52kUDJ.VfGdoSG47xeeF9LY2elEB6HVH/.9ePy
-_ukS9sGNGFcq_ECk9adb	company3@example.com	Bob	Johnson	\N	f	2025-10-08 22:21:08.486091	2025-10-08 22:21:08.486091	$2b$10$Ki/bL0F6dtAv5rOKqcQ0QuRhz3.pqBse3monpEvBoCRnHP7725e6u
C6t_il1kk66QwoaZI7L4z	i222434@nu.edu.pk	Hassaan		\N	f	2025-10-01 11:55:51.688928	2025-10-15 00:20:18.058	$2b$10$K36kA/DkEjpNO2cEaedJHuvqDVGNPZ1jSo/byBkdZP6osnfNND/US
e3bdb727-a5c4-4dec-9820-2467503d7546	test@curacaointernationalsportsweek.com	Test	User	\N	t	2025-10-18 13:22:31.972941	2025-10-18 13:22:31.972941	$2b$10$.ktios/HBx8jlHY36o91ae6GYr1vyuKyOzd8mXUU8ibfGwT4ul3T.
8bd65f32-188d-465d-9fb4-684728bd3412	test2@curacaointernationalsportsweek.com	Test2	User2	\N	t	2025-10-18 13:22:55.952799	2025-10-18 13:22:55.952799	$2b$10$mxMkrjJw.jEiJq.9twgdU.ThZtOfQdkrD/cauVadI/T/xETZUgG9u
c771265c-cc8c-4f13-897d-30140dda6296	test-email@curacaointernationalsportsweek.com	Email	Test	\N	t	2025-10-18 13:24:59.124499	2025-10-18 13:24:59.124499	$2b$10$ByOJpOJH0mgwNvOxlUP/2elqBu5zJ.hiaskhDhCXveFSsRO9.qoPW
5143c809-7384-4e40-ad93-6c68d561e6da	test-curl@curacaointernationalsportsweek.com	Curl	Test	\N	t	2025-10-18 13:25:46.126168	2025-10-18 13:25:46.126168	$2b$10$XhaFAExUi5BCYhu6yu3Eye/JpaU2YcHdV/m/DDqLx/mQpOW0FmVGC
147ee355-5816-42d3-ad89-c7ec38064978	hassan.ejaz400@gmail.com	Hassan	Ejaz	\N	t	2025-10-18 13:27:21.776813	2025-10-18 13:27:21.776813	$2b$10$4WRei41d.jTzhA3MdnE1xO/USM3T6wevFeDLLYlGTxQuSNY6Tkdy.
8EJl9jRn8ql14G3MeEZo8	i222328@nu.edu.pk	hsahashd		\N	f	2025-10-18 13:34:20.176379	2025-10-18 13:34:20.176379	$2b$10$YRpipDoD.T5RnLUZLediCu7rGFaWOilo.z.LCERqkcFxk4ApYoG/W
\.


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE SET; Schema: _system; Owner: neondb_owner
--

SELECT pg_catalog.setval('_system.replit_database_migrations_v1_id_seq', 4, true);


--
-- Name: replit_database_migrations_v1 replit_database_migrations_v1_pkey; Type: CONSTRAINT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1
    ADD CONSTRAINT replit_database_migrations_v1_pkey PRIMARY KEY (id);


--
-- Name: companies companies_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_email_unique UNIQUE (email);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: events events_short_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_short_code_key UNIQUE (short_code);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: task_proofs task_proofs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_proofs
    ADD CONSTRAINT task_proofs_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_replit_database_migrations_v1_build_id; Type: INDEX; Schema: _system; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_replit_database_migrations_v1_build_id ON _system.replit_database_migrations_v1 USING btree (build_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: companies companies_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: event_registrations event_registrations_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: task_proofs task_proofs_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_proofs
    ADD CONSTRAINT task_proofs_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: task_proofs task_proofs_task_id_tasks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_proofs
    ADD CONSTRAINT task_proofs_task_id_tasks_id_fk FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict 4XWjIfvUtScFWpJTIvk3IGzSWDqtGLxb8kPyeqJxrCEGW6y7p4xIndsDSbnwl8M

