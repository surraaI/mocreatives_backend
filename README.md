# MoCreatives Backend

A lightweight CMS backend for the MoCreatives website. Provides admin management, blog CRUD, contact form handling, subscription/verification emails, file uploads (Cloudinary), and authentication using JWT.

This repository contains the Express.js API used by the MoCreatives frontend to manage content and send transactional emails.

## Features

- Admin user management (superadmin/admin roles)
- JWT authentication and password reset flow
- Blog posts: create, update, delete, list, get
- Contact form capture with admin notifications
- Email subscription verification and unsubscribe flow
- File uploads via Cloudinary (images)
- Seed script to create a `superadmin` account

## Tech Stack

- Node.js + Express
- MongoDB (Mongoose)
- Cloudinary for file storage
- Nodemailer for transactional emails
- Passport / JWT for authentication

## Prerequisites

- Node.js 16+ (or current LTS)
- MongoDB instance (local or cloud)
- Cloudinary account (for uploads)
- SMTP credentials (Gmail or other SMTP provider)

## Environment Variables

Create a `.env` file at the project root or set these variables in your environment. The app expects the following keys:

- `PORT` – server port (defaults to `3000`)
- `NODE_ENV` – `development` or `production`
- `MONGODB_URI` – MongoDB connection string
- `JWT_SECRET` – secret used to sign JWTs
- `JWT_EXPIRES_IN` – token expiry, e.g. `7d`
- `EMAIL_USER` – SMTP username or from-address
- `EMAIL_PASSWORD` – SMTP password / application password
- `SUPERADMIN_EMAIL` – email for seeded superadmin (optional)
- `SUPERADMIN_INITIAL_PASSWORD` – initial password for seeded superadmin (optional)
- `CLIENT_URL` – frontend URL used in email links (e.g., `https://mocreatives.example`)
- `CLOUDINARY_CLOUD_NAME` – Cloudinary cloud name
- `CLOUDINARY_API_KEY` – Cloudinary API key
- `CLOUDINARY_API_SECRET` – Cloudinary API secret

Note: `seed.js` will use `SUPERADMIN_EMAIL` and `SUPERADMIN_INITIAL_PASSWORD` when creating the initial superadmin account.

## Quick Start (Local)

1. Install dependencies

```bash
npm install
```

2. Create a `.env` file with the variables listed above.

3. Run the app in development

```bash
npm run dev
```

4. Seed a superadmin (optional)

```bash
node seed.js
```

The server starts on `http://localhost:3000` by default (or the port you set in `PORT`).

## Available Scripts

- `npm start` — start production server (assumes env vars configured)
- `npm run dev` — start development server with `nodemon` (if present)
- `node seed.js` — create initial `superadmin` user

Check `package.json` for exact script names and tooling.

## API Endpoints (overview)

All routes are prefixed by the app's configured base (see `app.js`). Main route groups:

- `POST /auth/register` — create new admin (protected: superadmin)
- `POST /auth/login` — admin login (returns JWT)
- `POST /auth/forgot-password` — request password reset
- `PATCH /auth/reset-password/:token` — reset password using token
- `PATCH /auth/update-password` — update password (authenticated)

- `GET /admin` — list admins (protected: superadmin)
- `PATCH /admin/:id` — update admin profile (with optional `profilePhoto` upload)
- `DELETE /admin/:id` — delete admin (protected: superadmin)

- `GET /blogs` — list public blogs
- `GET /blogs/:id` — get single blog
- `POST /blogs` — create blog (protected: admin/superadmin; accepts `image` file)
- `PATCH /blogs/:id` — update blog (protected: admin/superadmin; accepts `image` file)
- `DELETE /blogs/:id` — delete blog (protected: admin/superadmin)

- `POST /contacts` — submit contact form
- `GET /contacts` — list contacts (protected: admin/superadmin)
- `GET /contacts/:id` — get specific contact (protected: admin/superadmin)

- `POST /subscriptions` — subscribe (sends verification email)
- `GET /subscriptions/verify/:token` — verify subscription
- `GET /subscriptions/unsubscribe/:token` — unsubscribe

For detailed payloads and error responses, inspect the controllers in `controllers/`.

## File Uploads

Uploads use Cloudinary. Ensure the Cloudinary environment variables are set and the `fileUploadMiddleware` is configured correctly. Uploads are handled as multipart form-data; for example when creating a blog, include the image under the `image` field.

## Email / SMTP

The app uses `nodemailer` configured for SMTP. Provide `EMAIL_USER` and `EMAIL_PASSWORD`. Gmail users should create an App Password if using 2FA or enable less-secure-app access (not recommended).

## Deployment

This repository contains a `vercel.json` file and can be deployed to Vercel. Ensure all environment variables are configured in your Vercel project settings. If deploying elsewhere, make sure process managers (PM2, Docker) or cloud providers expose the `PORT` and provide env vars.

## Troubleshooting

- SMTP connection failures: verify SMTP host/port, credentials, and that your provider allows programmatic SMTP access.
- Cloudinary upload errors: check API credentials and ensure the uploaded file meets limits.
- JWT errors: confirm `JWT_SECRET` and token expiry are set.

## Contributing

Contributions are welcome. Please open an issue first to discuss changes. When ready, send a pull request with focused commits and a clear description.

## License

Specify your license here (e.g., MIT) or include a `LICENSE` file.

## Useful Files

- `app.js` — application entry
- `seed.js` — creates a `superadmin` user
- `routes/` — route definitions
- `controllers/` — request handlers and business logic
- `middlewares/` — authentication and file upload middleware

---

If you'd like, I can also generate example `.env.example` and Postman collection for common requests — want me to add those?
