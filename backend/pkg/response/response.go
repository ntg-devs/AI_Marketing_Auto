package response

import (
	"encoding/json"
	"net/http"
)

// APIResponse defines the standard structure for all JSON responses
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// JSON sends a successful standard JSON response
func JSON(w http.ResponseWriter, status int, data interface{}, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Error sends a failed standard JSON response
func Error(w http.ResponseWriter, status int, errMessage string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Error:   errMessage,
	})
}
