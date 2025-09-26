import './App.css';
import { AudioControls } from './components/AudioControls';
import { ChatInterface } from './components/ChatInterface';

function App() {
  return (
    <div className="App">
      <AudioControls />
      <ChatInterface />
    </div>
  );
}

export default App;
