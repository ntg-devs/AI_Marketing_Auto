package http

import (
	"bityagi/internal/domain"
	"bityagi/pkg/response"
	"encoding/json"
	"net/http"
)

type userHandler struct {
	service domain.UserService
}

func NewUserHandler(service domain.UserService) *userHandler {
	return &userHandler{service: service}
}

func (h *userHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req domain.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	res, err := h.service.Register(r.Context(), &req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	// We pass res.Message if it exists as the top-level message.
	message := "Register successful"
	if res.Message != "" {
		message = res.Message
	}

	response.JSON(w, http.StatusCreated, res, message)
}

func (h *userHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	res, err := h.service.Login(r.Context(), &req)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, res, "Login successful")
}

func (h *userHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	var req domain.GoogleLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	res, err := h.service.GoogleLogin(r.Context(), &req)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, res, "Google login successful")
}

func (h *userHandler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req domain.VerifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	res, err := h.service.VerifyEmailOTP(r.Context(), &req)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.JSON(w, http.StatusOK, res, "OTP verified successfully")
}

func (h *userHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*domain.User)
	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updatedUser, err := h.service.UpdateProfile(r.Context(), user.ID, updates)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, updatedUser, "Profile updated successfully")
}

func (h *userHandler) GetTeamMembers(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*domain.User)
	// For now, use the user's primary team. In a multi-team setup, id would be from URL param.
	teams, err := h.service.GetTeamMembers(r.Context(), user.TeamID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, teams, "Team members retrieved")
}

func (h *userHandler) GetWorkspace(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*domain.User)
	workspace, err := h.service.GetWorkspace(r.Context(), user.TeamID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, workspace, "Workspace retrieved")
}

func (h *userHandler) UpdateWorkspace(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*domain.User)
	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	workspace, err := h.service.UpdateWorkspace(r.Context(), user.TeamID, updates)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, workspace, "Workspace updated successfully")
}

func (h *userHandler) GetHealthStats(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*domain.User)
	stats, err := h.service.GetHealthStats(r.Context(), user.TeamID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, stats, "Health stats retrieved")
}
