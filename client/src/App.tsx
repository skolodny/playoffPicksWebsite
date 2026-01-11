import { Route, createHashRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Header from './components/nav/Header';
import PickSubmission from './pages/PickSubmission/PickSubmission';
import Fantasy from './pages/Fantasy/Fantasy';
import { ProtectedRoute } from './routes/ProtectedRoute';
import AuthProvider from './provider/authProvider';
import GlobalProvider from './provider/globalProvider';
import { AdminProtectedRoute } from './routes/AdminProtectedRoute';
import { CreateQuestions } from './pages/admin/CreateQuestions';

const router = createHashRouter(
  createRoutesFromElements(
    <Route path="/" element={<Header />}>
      <Route index element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/pickSubmission" element={<PickSubmission />} />
        <Route path="/fantasy" element={<Fantasy />} />
      </Route>
      <Route element={<AdminProtectedRoute />}>
        <Route path="/createQuestions" element={<CreateQuestions />} />
      </Route>
    </Route>
  )
);

function App() {
  return (
    <AuthProvider>
      <GlobalProvider>
        <RouterProvider router={router} />
      </GlobalProvider>
    </AuthProvider>
  );
}

export default App;