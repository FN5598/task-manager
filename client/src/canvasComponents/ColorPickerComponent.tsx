import { HexColorPicker } from "react-colorful";

type ColorPickerProps = {
    color: string;
    setColor: (value: string) => void;
}

export function ColorPickerComponent({ color, setColor }: ColorPickerProps) {
    return <HexColorPicker color={color} onChange={setColor} />
}