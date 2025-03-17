import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import routes from './config/routes'

function App() {
  const router = createBrowserRouter(routes);

  return (
    <>
      <Toaster position='top-right' />
      <RouterProvider router={router} />
    </>
  )
}

export default App