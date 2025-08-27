import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Login from "./pages/Login";
import Layout from "./Layout";
import Menu from "./pages/Menu";



function App() {

  return (
    <div className="">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<h1>Home</h1>} />
          <Route path="/menu" element={<Menu />} />
        </Route>
        
      </Routes>

    </div>
  );
}

export default App;
