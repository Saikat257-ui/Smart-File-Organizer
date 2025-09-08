# Drive AI Organizer

A Next.js full-stack web application that connects to Google Drive, intelligently lists and visualizes files, and leverages Qwen AI to recommend and automatically apply clean, human-readable file names and folder structures.

## Features

- 🔐 **Google OAuth Authentication** - Secure login with Google Drive access
- 📁 **Interactive File Tree** - Visualize your Drive files in a collapsible hierarchy
- 🤖 **AI-Powered Suggestions** - Qwen AI analyzes and suggests better file names
- 📊 **Real-time Progress** - Live updates during file operations with Socket.IO
- 🎨 **Modern UI** - Beautiful glassmorphism design with Framer Motion animations
- 📄 **Document Processing** - Extract text from DOCX and PDF files for better AI context
- ✅ **Preview & Apply** - Review AI suggestions before applying changes

## Tech Stack

### Frontend
- **Next.js 15** with App Router and Turbopack
- **React 19** with React DOM
- **Tailwind CSS 4.0** with custom glassmorphism styles
- **Framer Motion** for smooth animations
- **React Icons** for consistent iconography
- **Socket.io-client** for real-time updates

### Backend
- **Node.js** with Next.js API Routes
- **Google Drive API** for file operations
- **NextAuth.js** for authentication
- **Socket.IO** for real-time communication
- **OpenRouter API** for Qwen AI integration

### File Processing
- **mammoth** for DOCX text extraction
- **pdf-parse** for PDF text extraction

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# OpenRouter API Configuration
OPENROUTER_API_KEY=your-openrouter-api-key-here

# Socket.IO Configuration
SOCKET_PORT=3001
```

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID and Client Secret to your `.env.local`

### 3. OpenRouter API Key

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Add it to your `.env.local` file

### 4. Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

### 5. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign In**: Click "Connect with Google Drive" to authenticate
2. **Browse Files**: View your Drive files in the interactive tree structure
3. **Select Files**: Choose files you want to organize using checkboxes
4. **Get AI Suggestions**: Click "Get AI Suggestions" to analyze selected files
5. **Review Suggestions**: Preview the AI-recommended names and folder structures
6. **Apply Changes**: Approve suggestions and apply them to your Drive

## File Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth configuration
│   │   ├── ai/suggestions/         # AI suggestion generation
│   │   └── drive/                  # Google Drive API endpoints
│   ├── auth/                       # Authentication pages
│   ├── components/                 # React components
│   └── providers/                  # Context providers
├── hooks/                          # Custom React hooks
├── lib/                           # Utility libraries
│   ├── driveUtils.js              # Google Drive operations
│   ├── fileProcessors.js          # Document processing
│   └── socket.js                  # Socket.IO server setup
└── public/                        # Static assets
```

## Key Components

- **Dashboard**: Main application interface
- **FileTree**: Interactive file browser with selection
- **AISuggestions**: AI recommendation cards with approve/reject
- **StatusLog**: Real-time operation logging
- **ProgressBar**: Live progress tracking overlay

## API Endpoints

- `GET /api/drive/files` - Fetch user's Drive files
- `POST /api/drive/apply-changes` - Apply approved file changes
- `POST /api/ai/suggestions` - Generate AI naming suggestions
- `POST /api/drive/content` - Extract file content for AI analysis
- `POST /api/drive/create-folder` - Create new folders

## Development

```bash
# Run with Turbopack (faster)
npm run dev

# Build for production
npm run build

# Start production server (local)
npm run start:local

# Start Next.js server (for Vercel)
npm start

# Lint code
npm run lint
```

## Deployment

### Vercel Deployment

This application is optimized for deployment on Vercel with the following configurations:

#### 1. Environment Variables Setup

In your Vercel dashboard, add these environment variables:

```env
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-here
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
```

#### 2. Google OAuth Configuration

Update your Google Cloud Console OAuth settings:
- Add your Vercel domain to authorized origins
- Update redirect URI to: `https://your-app-name.vercel.app/api/auth/callback/google`

#### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect your GitHub repository to Vercel for automatic deployments
```

#### 4. Socket.IO on Vercel

The application automatically detects Vercel environment and adapts Socket.IO configuration:
- Uses API routes for real-time communication
- Falls back to polling transport when needed
- Maintains full functionality in serverless environment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open a GitHub issue or contact the development team.
