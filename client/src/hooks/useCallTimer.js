import { useEffect, useRef, useState } from "react";


export function useCallTimer(status) {
const startRef = useRef(null);
const [duration, setDuration] = useState("00:00");


useEffect(() => {
let interval = null;


if (status === "connected") {
startRef.current = Date.now();
interval = setInterval(() => {
const diff = Math.floor((Date.now() - startRef.current) / 1000);
const mins = String(Math.floor(diff / 60)).padStart(2, "0");
const secs = String(diff % 60).padStart(2, "0");
setDuration(`${mins}:${secs}`);
}, 1000);
}


if (status !== "connected") {
setDuration("00:00");
startRef.current = null;
}


return () => clearInterval(interval);
}, [status]);


return { duration };
}