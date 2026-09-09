import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import About from './About'

function Contact() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/about?section=inquiry#inquiry', { replace: true })
  }, [navigate])

  return <About />
}

export default Contact
