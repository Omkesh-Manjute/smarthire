import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import About from './About'

function Support() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/about?section=support#support', { replace: true })
  }, [navigate])

  return <About />
}

export default Support
