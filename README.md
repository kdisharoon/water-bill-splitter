# Water Bill Splitter

A single-page web application built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **Prisma** designed to split a 2-apartment water bill purely proportionally based on submeter readings, with vacancy overrides, historical record tracking, and instant Email + Email-to-SMS tenant notifications.

Domain: `https://water.dish.place`

---

## Features

1. **Two-Stage Monthly Workflow**:
   - **Stage 1 (1st – 2nd of month)**: Enter the Total Building Meter reading and the Floor 2 submeter reading. The app automatically fetches the prior month's readings to compute consumption ($\Delta \text{Total}$, $\Delta \text{Floor 2}$, and $\Delta \text{Floor 1}$).
   - **Stage 2 (5th – 6th of month)**: Enter the total utility bill amount once received. The app calculates exact proportional dollar amounts down to the penny.
2. **Pure Proportional Math**:
   - Tenant costs match their exact percentage of total water consumed:
     $$\text{Floor 2 Cost} = \text{Total Bill} \times \left(\frac{\Delta \text{Floor 2}}{\Delta \text{Total}}\right)$$
     $$\text{Floor 1 Cost} = \text{Total Bill} - \text{Floor 2 Cost}$$
3. **Vacancy Overrides**:
   - Check **"Apartment 1 is Vacant"** $\rightarrow$ 100% of the bill is allocated to Apartment 2.
   - Check **"Apartment 2 is Vacant"** $\rightarrow$ 100% of the bill is allocated to Apartment 1.
   - Readings are still recorded to preserve the baseline for subsequent months.
4. **Free Notifications (Email + Email-to-SMS)**:
   - Deliver notifications via regular email and/or SMS text messages through major US carriers' free Email-to-SMS gateways (e.g. `5551234567@vtext.com` for Verizon, `txt.att.net` for AT&T, `tmomail.net` for T-Mobile).
   - Zero carrier SMS fees, no A2P 10DLC campaign registration required.
5. **Historical Records**:
   - View past billing months in chronological order.
   - Re-open, edit, or delete any past month.
   - Resend notifications anytime directly from the history table.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Push Prisma schema to local SQLite database
npx prisma db push

# 3. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Run 100% Free Forever on `water.dish.place`

### 1. Free Cloud Database (Neon / Supabase)
Because Vercel is serverless, use a free cloud PostgreSQL database instead of a local SQLite file:
1. Create a free account at [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Create a new database and copy the connection string:
   `postgresql://user:password@host/neondb?sslmode=require`
3. In `prisma/schema.prisma`, update the datasource provider to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Run `npx prisma db push` to initialize the tables.

### 2. Free Email Delivery & Verified Domain (Resend)
1. Sign up for a free account at [Resend.com](https://resend.com) (3,000 free emails/month).
2. Go to **Domains** $\rightarrow$ **Add Domain** $\rightarrow$ `dish.place`.
3. Add the generated DNS records (DKIM, SPF, MX) to your DNS registrar for `dish.place`.
   *(Authenticating `dish.place` guarantees Verizon, AT&T, and T-Mobile gateway servers accept your text messages).*
4. Create an API Key in Resend and copy it.

### 3. Deploy to Vercel (Free)
1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and import this repository.
3. Add the Environment Variables:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `RESEND_API_KEY`: Your Resend API key.
   - `SENDER_EMAIL`: `water@dish.place`
   - `NEXT_PUBLIC_APP_URL`: `https://water.dish.place`
4. Click **Deploy**.

### 4. Connect Custom Subdomain `water.dish.place`
1. In your Vercel project dashboard, go to **Settings** $\rightarrow$ **Domains**.
2. Add `water.dish.place`.
3. In your DNS provider for `dish.place`:
   - **Type**: `CNAME`
   - **Name / Host**: `water`
   - **Target / Value**: `cname.vercel-dns.com`
4. Vercel will automatically verify the record and issue a free SSL certificate.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
