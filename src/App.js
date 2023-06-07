
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import CreateRoom from "./src/routes/CreateRoom";
import Room from "./src/routes/Room";
import DjangoRoom from "./src/routes/DjangoRoom";
function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateRoom/>} />
        <Route path="/room/:roomID" element={<Room/>} />
        <Route path="/dj/room/:roomID" element={<DjangoRoom/>} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;