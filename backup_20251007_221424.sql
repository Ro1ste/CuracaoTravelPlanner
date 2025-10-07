--
-- PostgreSQL database dump
--

\restrict UdoUAidfy9o292r0xDLvj4KDoT7gfj9J9LKOQV59l4bHTK25wJy2CUAEhoZv2L6

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
14a36f2b-9387-4d45-b8b5-eb3536ee3ee0	Roen	Trinidad 	info@velittexperience.com	+59995215755	1	\N	#211100	0	0	100	M28aCeyQ1tdCzqz0aIKBw	2025-10-01 10:18:38.772012	2025-10-01 10:18:38.772012
96a30675-8bc1-4766-ad2e-ddb49fec7201	Hashers	Hassaan	i222434@nu.edu.pk	+923144685510	1	\N	#211100	0	0	100	C6t_il1kk66QwoaZI7L4z	2025-10-01 11:55:51.734659	2025-10-01 11:55:51.734659
3db33900-2ad3-48d0-836d-1475ade93276	Test Company	Test User	test@example.com	+1234567890	1	\N	#211100	0	0	100	HJiyOqgKX1dhWPr4yMtmd	2025-10-02 10:34:55.942676	2025-10-02 10:34:55.942676
8fb384c0-e4f3-40d8-8587-0d1462943ead	Admin Company	Admin User	admin@example.com	+1234567890	1	\N	#211100	0	0	100	nmYO1mnjnWoEFTMkwyqh7	2025-10-02 10:35:42.123547	2025-10-02 10:35:42.123547
13079d64-2ca6-400a-85b6-1c9b2c9fc61e	Test Company	John Doe	company@example.com	+1234567890	1	\N	#211100	0	0	100	I7w4K2BOY-sekPVcFmpZf	2025-10-02 11:34:52.334071	2025-10-02 11:34:52.334071
49761448-cadd-4749-ad0d-1eee63979025	Questventure	Maria Santos	info@velitt.com	+59995215755	1	\N	#211100	0	0	100	OsW-7ssLQDlHVmUBuJTab	2025-10-02 15:57:55.427356	2025-10-02 15:57:55.427356
4d8554d9-6dd8-4a05-b27b-5b2a1819d7d1	EISW Test Co	Test User	info@curacaointernationalsportsweek.com	1234567890	10	\N	#211100	0	0	100	6e770c08-3887-44a6-bda7-1c43d128b911	2025-10-06 10:45:36.492012	2025-10-06 10:45:36.492012
\.


--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.event_registrations (id, event_id, first_name, last_name, email, phone, status, qr_code, checked_in, checked_in_at, registered_at, approved_at, company_name, qr_code_payload, qr_code_issued_at) FROM stdin;
b344bafb-df8c-483a-8208-9bfbde5b4692	e6440dcc-456a-47cd-a9d0-4e01e65ef14f	BHey	HTer	hassanejaz400@gmail.com	+923144685510	pending	\N	f	\N	2025-10-06 11:06:34.1944	\N	Hashers	\N	\N
34e2ee29-b350-4f7b-9aed-4a2f94774baf	e6440dcc-456a-47cd-a9d0-4e01e65ef14f	Email	Test	hassanejaz400@gmail.com	123	approved	\N	f	\N	2025-10-06 11:07:11.969614	2025-10-06 11:07:27.13	EISW	\N	\N
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.events (id, title, description, event_date, branding_color, is_active, created_at, email_subject, email_body_text, youtube_url, short_code) FROM stdin;
e6440dcc-456a-47cd-a9d0-4e01e65ef14f	Corporate Challenge Kickoff	\N	2025-10-15 14:00:00	#211100	t	2025-10-06 10:42:52.345701	\N	\N	\N	EQD_55
f662a5d1-4d0b-46dc-9784-d2e2264af7e5	Yesasd	Noasdsadasdas	2025-10-08 11:04:00	#ff6600	t	2025-10-06 11:04:58.142584	Hey	HAsdad	\N	HKTEJ1
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
LlggnBmskxGPN_gWCyY7mvZ7JVh731xc	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-09T10:37:50.005Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "0ef90af0-504e-4515-9885-4b02354e00a2", "email": "superadmin@example.com", "claims": {"sub": "0ef90af0-504e-4515-9885-4b02354e00a2"}, "expires_at": 1760006267}}}	2025-10-09 10:37:51
mT5bNIXvnZ9JU0Cpgh6VqsByD4UOkFac	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-14T16:46:27.050Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-14 16:46:28
-TwoYbGFx1qsfLX6D503HoPqBZEACgyz	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-09T18:29:11.242Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "0ef90af0-504e-4515-9885-4b02354e00a2", "email": "superadmin@example.com", "claims": {"sub": "0ef90af0-504e-4515-9885-4b02354e00a2"}, "expires_at": 1760034551}}}	2025-10-09 18:29:13
bvYCAsjpNS8MDA_toDRUKGx8Qsc3Lgc8	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-10T19:17:01.780Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-10 19:17:04
rJGNWOoRxB-zwweEFBj63kHgpxzpfD5j	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-08T20:28:07.348Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-08 20:31:47
6MbYbLDDQAMP_FTSqcD_ctmF8K5IUzLC	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-09T10:35:01.007Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "HJiyOqgKX1dhWPr4yMtmd", "email": "test@example.com", "claims": {"sub": "HJiyOqgKX1dhWPr4yMtmd"}, "expires_at": 1760006098}}}	2025-10-09 10:35:02
oEQGQ8Th7scddH2xjo8foOlWvw76DjTH	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-09T10:36:25.972Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "0ef90af0-504e-4515-9885-4b02354e00a2", "email": "superadmin@example.com", "claims": {"sub": "0ef90af0-504e-4515-9885-4b02354e00a2"}, "expires_at": 1760006182}}}	2025-10-09 10:36:26
n5zXqKSCE6J3t3K1fnM6oUoQDYjW9Lpc	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-09T10:36:50.649Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "0ef90af0-504e-4515-9885-4b02354e00a2", "email": "superadmin@example.com", "claims": {"sub": "0ef90af0-504e-4515-9885-4b02354e00a2"}, "expires_at": 1760006208}}}	2025-10-09 10:36:51
piQ4YcKGDMMT_E5KN-FbyNFYUcDqGbeA	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-09T10:37:13.820Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "0ef90af0-504e-4515-9885-4b02354e00a2", "email": "superadmin@example.com", "claims": {"sub": "0ef90af0-504e-4515-9885-4b02354e00a2"}, "expires_at": 1760006231}}}	2025-10-09 10:37:14
hHeXR1xuNX5z2cGCU0lQBApyHxg9l9pj	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-09T10:38:21.466Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "0ef90af0-504e-4515-9885-4b02354e00a2", "email": "superadmin@example.com", "claims": {"sub": "0ef90af0-504e-4515-9885-4b02354e00a2"}, "expires_at": 1760006299}}}	2025-10-09 10:38:22
aeZT9W_5imRNrwIpCYfaZ78O4wIS5KpE	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-09T10:38:50.422Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "0ef90af0-504e-4515-9885-4b02354e00a2", "email": "superadmin@example.com", "claims": {"sub": "0ef90af0-504e-4515-9885-4b02354e00a2"}, "expires_at": 1760006327}}}	2025-10-09 10:38:51
zd9fwWJ3Ws2GvHXbGQw0XvGTMKPJUshR	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-13T10:45:18.676Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "6e770c08-3887-44a6-bda7-1c43d128b911", "email": "info@curacaointernationalsportsweek.com", "claims": {"sub": "6e770c08-3887-44a6-bda7-1c43d128b911"}, "expires_at": 1760352316}}}	2025-10-13 10:46:49
qJsuX8tvHTS9dhKpv7IDuGoXwM8FOdic	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-08T15:07:59.924Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-12 14:06:52
YYMOhk8VSXYPxUMK0K8JtfZsNDUz387Z	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-09T11:26:44.998Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "0ef90af0-504e-4515-9885-4b02354e00a2", "email": "superadmin@example.com", "claims": {"sub": "0ef90af0-504e-4515-9885-4b02354e00a2"}, "expires_at": 1760009201}}}	2025-10-09 11:26:45
fAb_3oRDRpLt7GT4ORMA3RVgxWppFuaa	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-09T11:26:51.241Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "0ef90af0-504e-4515-9885-4b02354e00a2", "email": "superadmin@example.com", "claims": {"sub": "0ef90af0-504e-4515-9885-4b02354e00a2"}, "expires_at": 1760009210}}}	2025-10-09 11:26:52
dr5-R7KNdOsGD0eizGCMJLttWxkxAC25	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-09T11:00:40.440Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "u9p9EfArYtSm4LUcxJT03MJKv34Gv5zEtiYZJeV0LTI"}}	2025-10-12 15:31:48
Y0A7GkdxBzjOlCV7QIu9Ci_RCR0pKkD-	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-07T20:33:54.067Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-07 20:53:37
GPpsyDySyKDLYl41ciGkbpsvp1xzo1y6	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-09T11:34:35.028Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "taeTy6ExevHtFH7suJ4kmW_n9262Pai84gS1Cwr6zEo"}}	2025-10-09 11:34:43
ivv9z0zXRqHlDdMK3pZrZCNG3Kteobsj	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-09T11:35:38.811Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "I7w4K2BOY-sekPVcFmpZf", "email": "company@example.com", "claims": {"sub": "I7w4K2BOY-sekPVcFmpZf"}, "expires_at": 1760009736}}}	2025-10-09 11:35:39
X1o7X33lYCjN735ikvDWy2Sd_Wn6AOME	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-07T19:50:42.419Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "EnMVEMedrevJFOfGXtWaVn283oKMgmu8Se2ggXH8pkk"}}	2025-10-08 15:27:02
y36tCylmURCkwpIne7ZFdWac9X8rc_7t	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-09T11:06:15.021Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-09 11:40:18
CHhjU_Lvq8ceqnSJ5uXGw8CjOCT2Wb2F	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-14T16:46:28.515Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-14 16:46:29
-dzUM4oYTW7XLZ0a6RFQXIIeyXLXRIKV	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-13T04:32:24.982Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a", "email": "admin@curacaointernationalsportsweek.com", "claims": {"sub": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a"}, "expires_at": 1760329944}}}	2025-10-13 04:36:47
BNtbDHnOUlQ6m7uxQrxsrLRfAtLeHOpx	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-13T10:07:39.290Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a", "email": "admin@curacaointernationalsportsweek.com", "claims": {"sub": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a"}, "expires_at": 1760350056}}}	2025-10-13 12:29:34
2YDO3YwtDDUDJcYPljNECSNSugY9rY8J	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-14T16:46:30.702Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-14 16:46:34
6QRQWIQb55vS4ytAcGP0kWNCXOmuSW_X	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-13T04:23:16.672Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "6e770c08-3887-44a6-bda7-1c43d128b911", "email": "info@curacaointernationalsportsweek.com", "claims": {"sub": "6e770c08-3887-44a6-bda7-1c43d128b911"}, "expires_at": 1760329396}}}	2025-10-13 04:57:48
awyQnpw45jahbp1zP5ZTdgXn3_tK5F2r	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-13T04:58:15.514Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "6e770c08-3887-44a6-bda7-1c43d128b911", "email": "info@curacaointernationalsportsweek.com", "claims": {"sub": "6e770c08-3887-44a6-bda7-1c43d128b911"}, "expires_at": 1760331494}}}	2025-10-13 04:58:22
BeLagJ-kL5y5An9nYhRCjAOpqBmuskIv	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-14T07:31:52.451Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a", "email": "admin@curacaointernationalsportsweek.com", "claims": {"sub": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a"}, "expires_at": 1760427112}}}	2025-10-14 16:43:41
Edg6_vELfdwkVhYlppvAoSdo2djagoX8	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-13T04:57:53.216Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a", "email": "admin@curacaointernationalsportsweek.com", "claims": {"sub": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a"}, "expires_at": 1760331472}}}	2025-10-13 04:58:10
alLrCVYOKvEQIaES_gXY3SPGahxo-pwR	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-13T04:23:12.270Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a", "email": "admin@curacaointernationalsportsweek.com", "claims": {"sub": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a"}, "expires_at": 1760329389}}}	2025-10-13 04:23:13
KmzjW14NSD4pJx1-FQ5Am2PqaHXmqovy	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-14T16:50:57.319Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a", "email": "admin@curacaointernationalsportsweek.com", "claims": {"sub": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a"}, "expires_at": 1760460654}}}	2025-10-14 16:51:03
AKx6kPegsUkRTriKMR9iN8oPXQpH79aB	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-14T16:55:24.048Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a", "email": "admin@curacaointernationalsportsweek.com", "claims": {"sub": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a"}, "expires_at": 1760460923}}}	2025-10-14 16:55:58
99M3OZ4apLbww8MUoqw9xWC-8CH0mkJe	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-13T11:00:45.645Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"id": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a", "email": "admin@curacaointernationalsportsweek.com", "claims": {"sub": "9ffe0dfb-2197-4b61-b7c9-26b0d784551a"}, "expires_at": 1760353230}}}	2025-10-14 03:57:11
BaJ1pKMOlWU7zUQar8TBd041jxKQfmqI	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-14T16:36:36.921Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-14 16:36:37
By-aN8VcjcGCxjq15JGiqUS2K9oaNrBb	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-14T16:36:38.079Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-14 16:36:39
4AiZHDiFZpBzlrEPJEHUFLMb7Z5Oa120	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-14T16:36:46.675Z", "httpOnly": true, "originalMaxAge": 604800000}}	2025-10-14 16:36:49
\.


--
-- Data for Name: task_proofs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.task_proofs (id, task_id, company_id, content_type, status, admin_notes, submitted_at, reviewed_at, content_urls) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tasks (id, title, description, points_reward, calories_burned, date, created_at, youtube_url) FROM stdin;
83666e76-9bc3-4abd-8015-670e9c0aae86	jump and Jump	Jumping Jacks: A full-body cardio exercise where you jump while spreading your legs and raising your arms overhead, then return to the starting position. They increase heart rate, burn calories, and improve endurance.\n\nPlanks: A core-strengthening exercise where you hold your body straight in a push-up position, resting on your forearms and toes. They build core stability, strengthen abs, back, and shoulders, and improve posture.	105	1500	2025-10-02 15:56:35.252822	2025-10-02 15:56:35.252822	https://www.youtube.com/watch?v=4l8ERXukrkA
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, is_admin, created_at, updated_at, password) FROM stdin;
M28aCeyQ1tdCzqz0aIKBw	info@velittexperience.com	Trinidad		\N	f	2025-10-01 10:18:38.732161	2025-10-01 10:18:38.732161	$2b$10$6mK/xQXESVmtr.yxUS3voOMtBPWL5O0q0wZfMf.ezM67asCv74Xsu
C6t_il1kk66QwoaZI7L4z	i222434@nu.edu.pk	Hassaan		\N	f	2025-10-01 11:55:51.688928	2025-10-01 11:55:51.688928	$2b$10$oEptkJf.DVZk2kZP.wqeveI6lsX983Zlpg7WjE9PQLSocRozH/HSS
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

\unrestrict UdoUAidfy9o292r0xDLvj4KDoT7gfj9J9LKOQV59l4bHTK25wJy2CUAEhoZv2L6

