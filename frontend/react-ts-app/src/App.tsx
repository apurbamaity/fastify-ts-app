import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Fileupload from './Components/Fileupload';
import { WebSocketProvider } from './context/WebSocketContext';

function Home() {
    return <h1 className="text-3xl font-bold underline text-red-500">Home Page</h1>;
}

function About() {
    return <h1 className="text-3xl font-bold underline text-blue-500">About Page</h1>;
}

function App() {
    return (
        <WebSocketProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/fileupload" element={<Fileupload />} />
                </Routes>
            </BrowserRouter>
        </WebSocketProvider>
    );
}

export default App;
