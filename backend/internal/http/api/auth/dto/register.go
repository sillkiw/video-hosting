package dto

type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
}

type RegisterResponse struct {
	Token string       `json:"jwt_token"`
	User  RegisterUser `json:"user"`
}

type RegisterUser struct {
	ID          string `json:"id"`
	Email       string `json:"emal"`
	DisplayName string `json:"display_name"`
	Role        string `json:"role"`
}
