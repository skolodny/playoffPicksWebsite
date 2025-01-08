import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Header from './components/nav/Header';
import PickSubmission from './pages/PickSubmission';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/playoffPicksWebsite" element={<Header />}>
      <Route index element={<Home />} />
      <Route path="/playoffPicksWebsite/login" element={<Login />} />
      <Route path="/playoffPicksWebsite/register" element={<Register />} />
      <Route path="/playoffPicksWebsite/pickSubmission" element={<PickSubmission />} />
    </Route>
  )
)

function App() {

  return (
    <>
      <RouterProvider router={router}/>
    </>
  );
}

export default App;