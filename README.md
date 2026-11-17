# Digital Nebula

Built an interactive 3D particle visualization featuring 15,000 particles with real time pointer driven rotation and color gradients. Pointer input covers mouse, touch and pen, and the rotation centre updates when the window is resized.

Implemented using Three.js with WebGL rendering, procedural texture generation, and optimized BufferGeometry for smooth performance.

Technologies: Three.js, WebGL, JavaScript ES6

## Run it

Open nebula.html in a browser, or serve the folder and visit it:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/nebula.html

## Controls

- Pointer: move to rotate and change speed, touch works too
- Arrow keys: nudge the rotation speed
- Space or the Pause button: pause and resume
- The animation also pauses while the tab is hidden, and the rotation eases back to base speed when the pointer leaves the window

## Tests

```sh
npm test
```

The smoke test checks that nebula.html wires up its handlers and that its module script parses.
