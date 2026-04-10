package task

import (
	"encoding/json"

	"github.com/google/uuid"
)

const (
	TypeGenerateContent = "task:generate_content"
	TypeSendWelcomeEmail = "task:send_welcome_email"
)

type GenerateContentPayload struct {
	UserID uuid.UUID `json:"user_id"`
	Prompt string    `json:"prompt"`
	Target string    `json:"target"` // e.g., "facebook", "linkedin"
}

type SendWelcomeEmailPayload struct {
	UserEmail string `json:"user_email"`
	FullName  string `json:"full_name"`
	OTP       string `json:"otp,omitempty"`
}

func MarshalPayload(payload interface{}) ([]byte, error) {
	return json.Marshal(payload)
}
