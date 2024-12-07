import React, { useEffect } from 'react'
import Editor from './pages/Editor'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import { useSelector } from 'react-redux'
import useOnauthstateListener from './Firebase/onauthstateListener'
import { BeatLoader } from 'react-spinners'
import SharedDoc from './pages/SharedDoc'

function ProtectedRoute({user, children}) {
  return user ? children : <Navigate to={'/login'} />
}
function PublicRoute({user, children}) {
  return !user ? children : <Navigate to={'/document'} />
}


function App() {
  const {user, isLoading} = useSelector((state) => state.auth);
  
  //if refresh, then set login details
  useOnauthstateListener();

  if(isLoading){
    return <div className='h-screen flex justify-center items-center'>
      <BeatLoader size={20}/>
    </div>
  }

  return (
    <BrowserRouter>
      <Routes>

        <Route path='/login' element = {
          <PublicRoute user={user} >
            <LoginPage />
          </PublicRoute>
        } />

        <Route path='/document' element={
          <ProtectedRoute user={user}>
            <Editor />
          </ProtectedRoute>
        } />

        <Route path='/document/:id' element ={ <SharedDoc /> } />

        <Route path="*" element={<Navigate to="/document" />} />
        
      </Routes>
    </BrowserRouter>
  )
}

export default App
