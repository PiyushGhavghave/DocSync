import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../Firebase/firebase-config';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '@/features/authslice/authslice';


const provider = new GoogleAuthProvider()

const LoginPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleGoogleLogin =  async () => {

    try{
      const result = await signInWithPopup(auth, provider)
      
      const user = {
        uid : result.user.uid,
        name : result.user.displayName,
        email : result.user.email,
        photoURL : result.user.photoURL,
      }
      dispatch(loginUser(user))
      navigate('/document')

    }
    catch(err){
      console.log('Login failed', err); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
      <div className="w-full max-w-[400px] bg-white rounded-lg shadow-sm p-8">

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">DocSync</h1>
          <p className="text-gray-500 text-md">Real-time collaboration & Document Management</p>
        </div>

 
        <div className="text-center">
          <h2 className="text-lg text-gray-800 mb-2">Welcome to DocSync</h2>
          <p className="text-gray-500 text-sm mb-6">Continue with your Google account</p>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 rounded border border-gray-300 bg-white text-gray-800 text-sm 
            flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200
            hover:bg-gray-100"
          >
            <img 
              src="https://cdn.cdnlogo.com/logos/g/35/google-icon.svg"
              alt="Google Logo"
              className="w-[18px] h-[18px]"
            />
            Continue with Google
          </button>

          {/* Terms */}
          <p className="mt-6 text-xs text-gray-500 text-center">
            By continuing, you agree to DocSync's Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;