# 🤖 AI Chat Assistant

A modern, feature-rich AI chatbot built with React, TypeScript, and Vite. This project demonstrates advanced web development techniques including real-time AI integration, conversation management, and responsive design.

![AI Chat Assistant](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Vite](https://img.shields.io/badge/Vite-6.3.5-purple)
![OpenRouter](https://img.shields.io/badge/OpenRouter-API-orange)

## ✨ Features

### 🎯 Core Functionality
- **Multi-Model AI Integration**: Automatically selects the best AI model based on task type (coding, research, general)
- **Real-time Chat**: Instant messaging with AI responses
- **Markdown Support**: Rich text formatting with code highlighting
- **Conversation Management**: Save, load, and manage multiple chat sessions

### 🎨 User Experience
- **Dark/Light Mode**: Toggle between themes with smooth transitions
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Typing Indicators**: Visual feedback during AI processing
- **Auto-scroll**: Smart scrolling to keep latest messages visible
- **Copy to Clipboard**: One-click copying of AI responses

### 🔧 Advanced Features
- **Task Detection**: Automatically detects coding, research, or general queries
- **Model Selection**: Chooses optimal AI model for each task type
- **Error Handling**: Robust error handling with user-friendly messages
- **Rate Limiting**: Built-in retry logic with exponential backoff
- **Export Conversations**: Download chat history as JSON files

### 📱 Mobile Optimized
- **Touch-friendly Interface**: Optimized for mobile touch interactions
- **Progressive Web App**: Installable as a native app
- **Offline Support**: Graceful handling of network issues
- **Accessibility**: ARIA labels and keyboard navigation support

## 🚀 Technologies Used

- **Frontend**: React 19.1.0, TypeScript 5.8.3
- **Build Tool**: Vite 6.3.5
- **Styling**: CSS3 with modern features (Grid, Flexbox, Custom Properties)
- **AI Integration**: OpenRouter API with multiple model support
- **Markdown**: Marked.js for rich text rendering
- **State Management**: React Hooks with localStorage persistence
- **Deployment**: Netlify (configured)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenRouter API key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-chat-assistant.git
   cd ai-chat-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_KEY=your_openrouter_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Environment Variables
- `VITE_API_KEY`: Your OpenRouter API key (required)

### API Configuration
The app uses OpenRouter API with automatic model selection:
- **Coding Tasks**: DeepSeek R1 (deepseek/deepseek-r1-0528:free)
- **Research Tasks**: Llama 4 Maverick (meta-llama/llama-4-maverick:free)
- **General Tasks**: Mistral 7B (mistralai/mistral-7b-instruct:free)

## 📁 Project Structure

```
src/
├── components/
│   ├── deepseak.tsx      # Main chat component
│   └── deepseak.css      # Component styles
├── types/
│   └── chat.ts           # TypeScript interfaces
├── utils/
│   └── chatUtils.ts      # Utility functions
├── App.tsx               # Root component
└── main.tsx             # Entry point
```

## 🎯 Key Features Explained

### Task Detection Algorithm
The app uses keyword-based analysis to automatically detect task types:
- **Coding**: Detects programming-related keywords and phrases
- **Research**: Identifies research and analysis requests
- **General**: Default for other queries

### Conversation Management
- **Local Storage**: Conversations persist across browser sessions
- **Auto-save**: Messages are saved automatically
- **Export**: Download conversations as JSON files
- **Delete**: Remove unwanted conversations

### Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Progressive Enhancement**: Enhanced features on larger screens
- **Touch-friendly**: Large touch targets and smooth interactions

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🔍 Performance Optimizations

- **Code Splitting**: Automatic code splitting with Vite
- **Lazy Loading**: Components load on demand
- **Caching**: Markdown parsing results cached
- **Debouncing**: Input handling optimized
- **Virtual Scrolling**: Ready for large conversation lists

## 🛡️ Security Features

- **API Key Protection**: Environment variables for sensitive data
- **Input Sanitization**: Markdown content safely rendered
- **Error Boundaries**: Graceful error handling
- **Rate Limiting**: Built-in protection against API abuse

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for AI model access
- [React](https://reactjs.org/) for the amazing framework
- [Vite](https://vitejs.dev/) for the fast build tool
- [Marked.js](https://marked.js.org/) for markdown parsing

## 📞 Support

If you have any questions or need help:
- Open an issue on GitHub
- Check the documentation
- Review the code comments

---

**Made with ❤️ using modern web technologies**
