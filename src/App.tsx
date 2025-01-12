import { Route, createHashRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Header from './components/nav/Header';
import PickSubmission from './pages/PickSubmission/PickSubmission';
import { ProtectedRoute } from './routes/ProtectedRoute';
import AuthProvider from './provider/authProvider';

const router = createHashRouter(
  createRoutesFromElements(
    <Route path="/" element={<Header />}>
      <Route index element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/pickSubmission" element={<PickSubmission />} />
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