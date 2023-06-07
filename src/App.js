
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import CreateRoom from "../../frontend/src/routes/CreateRoom";
import Room from "../../frontend/src/routes/Room";
import DjangoRoom from "../../frontend/src/routes/DjangoRoom";
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