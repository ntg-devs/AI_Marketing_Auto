package mail

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
)

type SMTPSender struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

func NewSMTPSender(host, port, username, password, from string) *SMTPSender {
	return &SMTPSender{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		From:     from,
	}
}

func (s *SMTPSender) SendEmail(to []string, subject string, htmlBody string) error {
	auth := smtp.PlainAuth("", s.Username, s.Password, s.Host)

	// Build the email headers
	headers := make(map[string]string)
	headers["From"] = s.From
	headers["To"] = to[0] // Simple implementation for 1 recipient
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"utf-8\""

	// Construct message
	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + htmlBody

	addr := fmt.Sprintf("%s:%s", s.Host, s.Port)

	return smtp.SendMail(addr, auth, s.From, to, []byte(message))
}

// GenerateOTPTemplate generates a simple HTML template for OTP emails
func GenerateOTPTemplate(fullName, otp string) (string, error) {
	tmpl := `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
		<title>Verify your email</title>
	</head>
	<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
		<div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
			<h2 style="color: #6366f1;">AetherFlow</h2>
			<p>Hello <b>{{.Name}}</b>,</p>
			<p>Thank you for registering. Please use the verification code below to activate your account:</p>
			<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #111827;">
				{{.OTP}}
			</div>
			<p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
		</div>
	</body>
	</html>
	`

	t, err := template.New("otp").Parse(tmpl)
	if err != nil {
		return "", err
	}

	var tpl bytes.Buffer
	if err := t.Execute(&tpl, map[string]string{
		"Name": fullName,
		"OTP":  otp,
	}); err != nil {
		return "", err
	}

	return tpl.String(), nil
}
