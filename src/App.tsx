import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Header from './components/nav/Header';
import PickSubmission from './pages/PickSubmission/PickSubmission';
import { ProtectedRoute } from './routes/ProtectedRoute';
import AuthProvider from './provider/authProvider';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/playoffPicksWebsite" element={<Header />}>
      <Route index element={<Home />} />
      <Route path="/playoffPicksWebsite/login" element={<Login />} />
      <Route path="/playoffPicksWebsite/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/playoffPicksWebsite/pickSubmission" element={<PickSubmission />} />
      </Route>
    </Route>
  )
);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;