// Draws with the finger on the canvas; onChange gets the PNG data URL.
const INK = "#1b1b1b";

export function signaturePad(canvas, initial, onChange) {
    const ctx = prepareCanvas(canvas);
    if (initial) {
        drawImage(canvas, ctx, initial);
    }
    bindDrawing(canvas, ctx, onChange);
    return { clear: () => ctx.clearRect(0, 0, canvas.width, canvas.height) };
}

// Sharp on high density screens: the canvas has the device's pixels.
function prepareCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    return ctx;
}

// The signature already in the draft.
function drawImage(canvas, ctx, dataUrl) {
    const { width, height } = canvas.getBoundingClientRect();
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, width, height);
    img.src = dataUrl;
}

function bindDrawing(canvas, ctx, onChange) {
    const stroke = { last: null }; // last point while drawing
    canvas.addEventListener("pointerdown", (event) => startStroke(canvas, ctx, stroke, event));
    canvas.addEventListener("pointermove", (event) => moveStroke(canvas, ctx, stroke, event));
    const end = () => endStroke(canvas, stroke, onChange);
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
}

function startStroke(canvas, ctx, stroke, event) {
    stroke.last = pointOf(canvas, event);
    canvas.setPointerCapture(event.pointerId);
    drawDot(ctx, stroke.last);
}

function moveStroke(canvas, ctx, stroke, event) {
    if (stroke.last) {
        stroke.last = drawLine(ctx, stroke.last, pointOf(canvas, event));
    }
}

function endStroke(canvas, stroke, onChange) {
    if (stroke.last) {
        stroke.last = null;
        onChange(canvas.toDataURL("image/png"));
    }
}

// The finger's point, in the canvas.
function pointOf(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
}

function drawDot(ctx, [x, y]) {
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
}

// Returns the point reached.
function drawLine(ctx, from, to) {
    ctx.beginPath();
    ctx.moveTo(...from);
    ctx.lineTo(...to);
    ctx.stroke();
    return to;
}
