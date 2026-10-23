/**
 * Razorpay Standard Web Checkout Integration Helper
 * Handles dynamic script loading, order creation, modal invocation, and signature verification.
 */

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true)
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true))
      existingScript.addEventListener('error', () => resolve(false))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout script')
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

/**
 * Initiates Razorpay Standard Web Checkout
 * @param {Object} options
 * @param {number} options.amountInPaise - Amount in smallest currency unit (paise/cents, e.g. 100 for ₹1.00)
 * @param {string} [options.currency='INR'] - Currency code ('INR' or 'USD')
 * @param {string} [options.planName='SmartHire Subscription'] - Name of plan or service
 * @param {string} [options.userEmail] - Prefill candidate/recruiter email
 * @param {string} [options.userName] - Prefill name
 * @param {string} [options.userPhone] - Prefill phone
 * @param {Function} [options.onSuccess] - Callback when payment is verified
 * @param {Function} [options.onFailure] - Callback on payment failure or verification error
 * @param {Function} [options.onDismiss] - Callback when user closes the modal
 */
export const initiateRazorpayCheckout = async ({
  amountInPaise,
  amountInUnits,
  currency = 'USD',
  planName = 'SmartHire Subscription',
  userEmail = '',
  userName = '',
  userPhone = '',
  onSuccess,
  onFailure,
  onDismiss
}) => {
  try {
    const isLoaded = await loadRazorpayScript()
    if (!isLoaded || !window.Razorpay) {
      throw new Error('Razorpay SDK could not be loaded. Please check your internet connection.')
    }

    const rawAmount = amountInUnits !== undefined ? amountInUnits : amountInPaise
    if (!rawAmount || Number(rawAmount) < 100) {
      throw new Error('Minimum order amount is 100 units ($1.00 / ₹1.00)')
    }

    // Step 1: Create Order via Backend
    const createOrderResponse = await fetch('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(Number(rawAmount)),
        currency: currency.toUpperCase(),
        receipt: `rcpt_${Date.now()}`,
        notes: {
          plan: planName,
          timestamp: new Date().toISOString()
        }
      })
    })

    const orderData = await createOrderResponse.json()
    if (!createOrderResponse.ok || !orderData.success) {
      throw new Error(orderData.message || 'Unable to initialize payment order with server.')
    }

    const keyId = orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TnRdmRn7ptPWD9'

    // Step 2: Open Razorpay Standard Checkout Modal
    const rzpOptions = {
      key: keyId,
      amount: orderData.amount,
      currency: orderData.currency || currency,
      name: 'SmartHire ATS',
      description: `${planName} · Verified Checkout`,
      image: '/favicon.svg',
      order_id: orderData.order_id || orderData.id,
      handler: async function (response) {
        try {
          // Step 3: Verify Payment Signature via Backend
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          })

          const verifyData = await verifyResponse.json()
          if (verifyResponse.ok && verifyData.success && verifyData.isPaid) {
            if (onSuccess) {
              onSuccess({
                ...verifyData,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                planName
              })
            }
          } else {
            const err = new Error(verifyData.message || 'Payment signature verification failed.')
            if (onFailure) onFailure(err)
            else alert(err.message)
          }
        } catch (verifyErr) {
          console.error('Verification request error:', verifyErr)
          if (onFailure) onFailure(verifyErr)
          else alert(`Payment verification error: ${verifyErr.message}`)
        }
      },
      prefill: {
        ...(userName?.trim() ? { name: userName.trim() } : {}),
        ...(userEmail?.trim() ? { email: userEmail.trim() } : {}),
        ...(userPhone?.trim() ? { contact: userPhone.trim() } : {})
      },
      notes: {
        plan_name: planName
      },
      theme: {
        color: '#2563eb'
      },
      modal: {
        ondismiss: function () {
          console.log('Razorpay modal dismissed by user.')
          if (onDismiss) onDismiss()
        }
      }
    }

    const rzpInstance = new window.Razorpay(rzpOptions)

    rzpInstance.on('payment.failed', function (response) {
      console.error('Razorpay payment failed:', response.error)
      if (onFailure) {
        onFailure(new Error(response.error.description || 'Payment transaction failed or cancelled by bank.'))
      } else {
        alert(`Payment Failed: ${response.error.description || 'Please try another card or UPI ID.'}`)
      }
    })

    rzpInstance.open()
    return rzpInstance
  } catch (err) {
    console.error('Razorpay checkout initialization error:', err)
    if (onFailure) onFailure(err)
    else alert(`Checkout Error: ${err.message}`)
    throw err
  }
}
