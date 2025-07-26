# TickTick Task Tagger - React App

A modern React application for automatically tagging your TickTick tasks with intelligent suggestions.

## 🚀 Features

- **🔐 Secure Authentication**: Uses Clerk for user authentication
- **🏷️ Smart Tag Suggestions**: AI-powered tag recommendations based on task content
- **📱 Modern UI**: Clean, responsive React interface
- **⚡ Real-time Processing**: Instant task updates
- **📊 Progress Tracking**: Visual progress indicators
- **🎯 Easy Task Management**: Streamlined workflow for tagging tasks

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Authentication**: Clerk
- **Styling**: CSS3 with modern design
- **API**: Express.js serverless functions
- **Deployment**: Vercel

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Clerk Account** for authentication
4. **TickTick Account** with API access

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Navigate to the React app directory
cd ticktick-react

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env.local

# Edit the environment file with your credentials
nano .env.local
```

Fill in your environment variables:

```env
# Clerk Authentication (Required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# TickTick API Configuration (Required)
TICKTICK_CLIENT_ID=your_client_id_here
TICKTICK_CLIENT_SECRET=your_client_secret_here
TICKTICK_USERNAME=your_ticktick_username_here
TICKTICK_PASSWORD=your_ticktick_password_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 4. Build for Production

```bash
# Build the app
npm run build

# Preview the build
npm run preview
```

## 🔐 Authentication Setup

### Clerk Configuration

1. **Create a Clerk Account**
   - Go to [clerk.com](https://clerk.com)
   - Sign up for a free account
   - Create a new application

2. **Get Your Keys**
   - Copy your Publishable Key and Secret Key
   - Update your `.env.local` file with these keys

3. **Configure Allowed Origins**
   - In your Clerk dashboard, add your domain to allowed origins
   - For development: `http://localhost:3000`
   - For production: Your Vercel domain

## 📋 TickTick API Setup

### 1. Register Your TickTick App

1. Visit the [TickTick Developer Center](https://developer.ticktick.com)
2. Register your application
3. Get your client ID and client secret

### 2. Configure Environment Variables

Add your TickTick credentials to `.env.local`:

```env
TICKTICK_CLIENT_ID=your_client_id_here
TICKTICK_CLIENT_SECRET=your_client_secret_here
TICKTICK_USERNAME=your_ticktick_username_here
TICKTICK_PASSWORD=your_ticktick_password_here
```

## 🚀 Deployment to Vercel

### 1. Connect to GitHub

1. Push your code to GitHub
2. Make sure all files are committed

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your repository
5. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./ticktick-react`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. Set Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add all variables from your `.env.local` file:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
TICKTICK_CLIENT_ID=your_client_id_here
TICKTICK_CLIENT_SECRET=your_client_secret_here
TICKTICK_USERNAME=your_ticktick_username_here
TICKTICK_PASSWORD=your_ticktick_password_here
NODE_ENV=production
```

### 4. Deploy

1. Click **Deploy** in Vercel
2. Wait for deployment to complete
3. Your app will be available at: `https://your-app-name.vercel.app`

## 🏗️ Project Structure

```
ticktick-react/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   └── main.jsx         # Application entry point
├── api/
│   ├── tasks.js         # API route for fetching tasks
│   └── tasks/
│       └── [taskId]/
│           └── tags.js  # API route for updating task tags
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── vercel.json         # Vercel configuration
└── env.example         # Environment variables template
```

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/status` - Check authentication status

### Tasks
- `GET /api/tasks` - Get unprocessed tasks with tag suggestions
- `POST /api/tasks/:taskId/tags` - Update task with selected tags

## 🏷️ Tag Categories

The system recognizes and suggests tags for:

- **Work**: meetings, projects, deadlines, reports
- **Personal**: family, home, health, hobbies
- **Urgent**: ASAP, critical, emergency items
- **Important**: priority, key, essential tasks
- **Low Priority**: optional, nice-to-have items
- **Creative**: design, writing, content creation

## 🎯 How It Works

1. **🔐 User Authentication**: Users sign in through Clerk's secure authentication
2. **📋 Task Fetching**: The app fetches unprocessed tasks from your TickTick account
3. **🏷️ Tag Suggestions**: AI analyzes task content and suggests relevant tags
4. **👤 User Selection**: Users can select from suggested tags or choose their own
5. **💾 Task Updates**: Selected tags are applied to tasks in your TickTick account

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Local Development

1. Start the development server: `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Sign in with Clerk
4. Start tagging your tasks!

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Clerk keys are correct
   - Check that Clerk application is properly configured
   - Ensure allowed origins include your domain

2. **TickTick API Errors**
   - Verify your client ID and secret are correct
   - Check that your username and password are valid
   - Ensure your TickTick account has API access

3. **Build Errors**
   - Check all environment variables are set
   - Verify Node.js version (16+ required)
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

## 🔒 Security Notes

- Never commit `.env.local` files to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor authentication logs for suspicious activity
- Your TickTick credentials are used server-side only

## 📞 Support

For issues and questions:

1. **TickTick API Issues**: Check the troubleshooting section above
2. **Technical Issues**: Review the API documentation
3. **Contact Support**: Reach out with detailed error messages

## 📄 License

MIT License - see LICENSE file for details.

## 🎉 Version History

- **v1.0.0** - Initial React release with Clerk authentication and TickTick integration
- Modern UI with responsive design
- Real-time task tagging workflow
- Intelligent tag suggestions
