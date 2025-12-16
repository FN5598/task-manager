import { ColorPickerComponent } from "../canvasComponents/ColorPickerComponent";
import { useRef, useState, useEffect } from "react"
import { Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import transformWordToLetters from "../utils/transformWordToLetters";

type CanvasComponentProps = {
    socket: Socket;
    joined: boolean;
    setJoined: (value: boolean) => void;
    setRoomId: (value: string) => void;
}

interface DrawData {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    lineWidth: number;
    isEraser: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function CanvasComponent({ socket, joined, setJoined, setRoomId }: CanvasComponentProps) {

    const navigate = useNavigate();
    const theme = localStorage.getItem("isLightTheme");

    const [wordToGuess, setWordToGuess] = useState<string>('');
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [lineWidth, setLineWidth] = useState(1);
    const [drawing, setDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const lastPosRef = useRef<{ x: number, y: number } | null>(null);
    const [isEraser, setIsEraser] = useState(false);
    const [colorPicker, setColorPicker] = useState(false);

    useEffect(() => {
        function handleDraw(data: DrawData) {
            if (!joined) return;

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!ctx) return;

            const { x1, y1, x2, y2, color, lineWidth, isEraser } = data;
            if (isEraser) {
                ctx.globalCompositeOperation = "destination-out";
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = "rgba(0,0,0,1)";
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineCap = "round";
                ctx.stroke();
                ctx.globalCompositeOperation = "source-over";
            } else {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = "round";
                ctx.stroke();
            }
        }
        // Listen for draw events from other clients
        socket.on("draw", handleDraw);

        socket.on("user-left", () => {
            toast.info("A user has left the room.", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: `${theme}`
            })
        });

        socket.on("word-to-guess", (word: string) => {
            setWordToGuess(word);
        })
        // Cleanup on unmount
        return () => {
            socket.off("draw", handleDraw);
            socket.off("word-to-guess");
            socket.off("user-left");
        };
    }, [socket, theme, joined]);

    function getCursorPos(e: React.MouseEvent<HTMLCanvasElement>) {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
        if (!drawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const pos = getCursorPos(e);
        if (!ctx || !pos) return;

        if (lastPosRef.current) {
            if (isEraser === false) {
                ctx.beginPath();
                ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = "round";
                ctx.stroke();
            } else if (isEraser === true) {
                ctx.globalCompositeOperation = "destination-out";
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = "rgba(0,0,0,1)";
                ctx.beginPath();
                ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                ctx.globalCompositeOperation = "source-over";
            }
            socket.emit("draw", {
                x1: lastPosRef.current.x,
                y1: lastPosRef.current.y,
                x2: pos.x,
                y2: pos.y,
                color,
                lineWidth,
                isEraser
            });
        }
        lastPosRef.current = pos;
    }

    function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
        setDrawing(true);
        const pos = getCursorPos(e);
        if (!pos) return;
        lastPosRef.current = pos;
    }

    function handleMouseUp() {
        setDrawing(false);
        lastPosRef.current = null;
    }


    function clearCanvas() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function handleLeave() {
        console.log("Leaving room", joined);
        if (!joined) return;
        socket.emit("leave-room");
        setJoined(false);
        setRoomId("");
        navigate(`/`);
    }

    return (
        <div className="text-text flex flex-col p-10">
            <div className="flex justify-center text-2xl">
                {wordToGuess && (transformWordToLetters(wordToGuess)?.map((char, index) => (
                    <p key={index} className="inline-block w-5 mr-1 border-b text-center">{char}</p>
                )))
                }
            </div>

            <canvas
                style={{
                    width: `${CANVAS_WIDTH}px`,
                    height: `${CANVAS_HEIGHT}px`,
                    display: 'block'
                }}
                className="border border-color-bg-light bg-gray-200 cursor-crosshair w-800 h-600 mt-4.5"
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            ></canvas>

            <div className="flex gap-4 items-center mb-4">
                <label htmlFor="lineWidth">Line Width:</label>
                <input
                    id="lineWidth"
                    type="range"
                    min="1"
                    max="20"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                    className="cursor-pointer"
                />
                <span>{lineWidth}px</span>

                <label htmlFor="colorPicker">Color:</label>
                <div
                    onMouseEnter={() => setTimeout(() => setColorPicker(true), 100)}
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => setColorPicker(prev => !prev)}
                    style={{ backgroundColor: color || "white" }}
                    id="colorPicker"></div>
                <div className="relative">
                    <div
                        className={colorPicker ? "flex absolute -left-6 -top-55" : "hidden"}
                        onMouseLeave={() => setTimeout(() => setColorPicker(false), 100)}>
                        <ColorPickerComponent color={color} setColor={setColor} />
                    </div>
                </div>

                <button
                    className="border border-border-color p-1 rounded-lg mt-2 cursor-pointer"
                    onClick={clearCanvas}
                >Clear canvas</button>

                <button
                    className="border border-border-color p-1 rounded-lg mt-2 cursor-pointer"
                    onClick={() => setIsEraser(prev => !prev)}
                >{isEraser ? "Paint" : "Erase"}
                </button>
            </div>
            <button
                onClick={() => handleLeave()}
            >Leave Room</button>
        </div>
    )
}


