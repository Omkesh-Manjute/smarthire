import React, { useState, useEffect } from "react"

/**
 * EmailComposerModal
 * - Pick from saved email templates (RTR, Interview, Rejection, Submission, etc.)
 * - Fill in variables (candidate_name, job_title, etc.)
 * - Live preview rendered body
 * - Send via recruiter configured SMTP or copy
 */
export default function EmailComposerModal({ onClose, candidate, job, recruiterEmail, recruiterName }) {
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [variables, setVariables] = useState({})
  const [renderedSubject, setRenderedSubject] = useState("")
  const [renderedBody, setRenderedBody] = useState("")
  const [toEmail, setToEmail] = useState(candidate?.email || "")
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState("")
  const [activeView, setActiveView] = useState("compose")

  const defaultVars = {
    candidate_name: candidate?.name || candidate?.candidateName || "",
    job_title: job?.title || job?.jobTitle || "",
    client_name: job?.clientName || job?.client || "",
    location: job?.location || "",
    duration: job?.duration || "6 months",
    pay_rate: candidate?.payRate || candidate?.expectedRate || "",
    recruiter_name: recruiterName || "Recruiter",
    recruiter_email: recruiterEmail || "",
    req_id: job?.id || job?.reqId || "",
    candidate_location: candidate?.location || candidate?.currentLocation || "",
    total_experience: candidate?.experience || candidate?.totalExp || "",
    work_auth: candidate?.workAuth || candidate?.workAuthorization || "",
    availability: candidate?.availability || candidate?.availableDate || "Immediate",
    key_skills: (job?.skills || []).slice(0, 4).join(", "),
    relevant_domain: job?.domain || "Enterprise IT",
    interview_date: "",
    interview_format: "Video Call",
    meeting_link: "",
    interviewer_name: "",
    hiring_manager_name: "",
  }

  useEffect(() => {
    fetchTemplates()
    setVariables(defaultVars)
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/email-templates")
      const data = await res.json()
      if (data.success) {
        setTemplates(data.templates || [])
        if (data.templates?.length > 0) {
          setSelectedTemplateId(data.templates[0].id)
        }
      }
    } catch (e) {}
  }

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  useEffect(() => {
    if (!selectedTemplate) return
    const render = (str) => {
      let result = str
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp("{{"+key+"}}", "g")
        result = result.replace(regex, value || "[" + key + "]")
      })
      return result
    }
    setRenderedSubject(render(selectedTemplate.subject || ""))
    setRenderedBody(render(selectedTemplate.body || ""))
  }, [selectedTemplateId, variables, templates])

  const handleSend = async () => {
    if (!toEmail || !renderedSubject || !renderedBody) return alert("To email, subject, and body are required")
    if (!recruiterEmail) return alert("Configure your email settings in Settings > Email Config first")
    setSending(true)
    setSendMsg("")
    try {
      const res = await fetch("/api/recruiter/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterEmail, to: toEmail, subject: renderedSubject, body: renderedBody })
      })
      const data = await res.json()
      setSendMsg(data.success ? "Email sent successfully!" : "Error: " + data.message)
    } catch (e) { setSendMsg("Network error") }
    setSending(false)
    setTimeout(() => setSendMsg(""), 5000)
  }

  const varKeys = Object.keys(defaultVars).filter(k => {
    const body = selectedTemplate?.body || ""
    const subject = selectedTemplate?.subject || ""
    return body.includes("{{"+k+"}}") || subject.includes("{{"+k+"}}")
  })

  const inputStyle = { width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, fontFamily: "inherit", background: "#fff", color: "#0f172a", boxSizing: "border-box" }
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }

  const CATEGORY_COLORS = { RTR: "#7c3aed", Interview: "#2563eb", Rejection: "#dc2626", Submission: "#16a34a", Custom: "#64748b" }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "92%", maxWidth: 960, maxHeight: "92vh", background: "#fff", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "14px 20px", background: "#0f172a", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Email Composer</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setActiveView(activeView === "compose" ? "preview" : "compose")} style={{ padding: "7px 14px", background: "#334155", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {activeView === "compose" ? "Preview" : "Edit"}
            </button>
            <button onClick={onClose} style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Close</button>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ width: 220, borderRight: "1px solid #e2e8f0", padding: 14, overflow: "auto", background: "#f8fafc" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Templates</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {templates.map(tpl => (
                <button key={tpl.id} onClick={() => setSelectedTemplateId(tpl.id)}
                  style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid", textAlign: "left", cursor: "pointer", fontSize: 12, background: selectedTemplateId === tpl.id ? "#0f172a" : "#fff", color: selectedTemplateId === tpl.id ? "#fff" : "#334155", borderColor: selectedTemplateId === tpl.id ? "#0f172a" : "#e2e8f0", fontWeight: selectedTemplateId === tpl.id ? 700 : 400 }}>
                  <div style={{ fontWeight: 700 }}>{tpl.name}</div>
                  <div style={{ fontSize: 10, marginTop: 3, opacity: 0.75 }}>{tpl.category}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {activeView === "compose" && (
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <div style={{ flex: 1, padding: 16, overflow: "auto", borderRight: "1px solid #e2e8f0" }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>To Email</label>
                    <input value={toEmail} onChange={e => setToEmail(e.target.value)} placeholder="candidate@email.com" type="email" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Subject</label>
                    <input value={renderedSubject} onChange={e => setRenderedSubject(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Body</label>
                    <textarea value={renderedBody} onChange={e => setRenderedBody(e.target.value)} rows={14} style={{ ...inputStyle, resize: "vertical", fontFamily: "Georgia, serif", lineHeight: 1.6 }} />
                  </div>
                </div>

                <div style={{ width: 220, padding: 14, overflow: "auto", background: "#fafafa" }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Fill Variables</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {varKeys.map(key => (
                      <div key={key}>
                        <label style={{ ...labelStyle, fontSize: 10 }}>{key.replace(/_/g, " ")}</label>
                        <input value={variables[key] || ""} onChange={e => setVariables(prev => ({ ...prev, [key]: e.target.value }))} placeholder={key.replace(/_/g, " ")} style={{ ...inputStyle, fontSize: 11, padding: "5px 8px" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === "preview" && (
              <div style={{ flex: 1, overflow: "auto", padding: 24, background: "#f8fafc" }}>
                <div style={{ maxWidth: 680, margin: "0 auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>From: {recruiterName} &lt;{recruiterEmail}&gt;</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>To: {toEmail}</div>
                  <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>{renderedSubject}</h3>
                  <pre style={{ whiteSpace: "pre-wrap", fontFamily: "Georgia, serif", fontSize: 13.5, lineHeight: 1.8, color: "#1e293b", margin: 0 }}>{renderedBody}</pre>
                </div>
              </div>
            )}

            <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", gap: 10, alignItems: "center" }}>
              {sendMsg && (
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: sendMsg.includes("success") ? "#16a34a" : "#dc2626" }}>{sendMsg}</div>
              )}
              <button onClick={() => navigator.clipboard.writeText(renderedBody)} style={{ padding: "9px 16px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Copy Body</button>
              <button onClick={handleSend} disabled={sending} style={{ padding: "9px 20px", background: sending ? "#94a3b8" : "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: sending ? "default" : "pointer" }}>
                {sending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
