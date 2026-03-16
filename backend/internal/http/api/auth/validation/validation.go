package authvalidation

import (
	"net/mail"
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/sillkiw/video-hosting/internal/http/api/auth/dto"
	apivalid "github.com/sillkiw/video-hosting/internal/http/api/validation"
)

var displayNameRe = regexp.MustCompile(`^[\p{L}\p{N}_\- ]+$`)

func (v *Validator) RegisterRequest(req dto.RegisterRequest) apivalid.Errors {
	errs := apivalid.New()

	v.email(errs, req.Email)
	v.displayName(errs, req.DisplayName)
	v.password(errs, req.Password)

	return errs
}

func (v *Validator) LoginRequest(req dto.LoginRequest) apivalid.Errors {
	errs := apivalid.New()

	v.email(errs, req.Email)
	v.password(errs, req.Password)

	return errs
}

func (v *Validator) email(errs apivalid.Errors, email string) {
	email = strings.TrimSpace(email)
	length := utf8.RuneCountInString(email)

	if length == 0 {
		errs.Add("email", "required")
		return
	}

	if length < v.Cfg.Email.MinLen {
		errs.Add("email", "too_short")
	}

	if length > v.Cfg.Email.MaxLen {
		errs.Add("email", "too_long")
	}

	if _, err := mail.ParseAddress(email); err != nil {
		errs.Add("email", "invalid")
	}
}

func (v *Validator) displayName(errs apivalid.Errors, displayName string) {
	displayName = strings.TrimSpace(displayName)
	length := utf8.RuneCountInString(displayName)

	if length == 0 {
		errs.Add("display_name", "required")
		return
	}

	if length < v.Cfg.DisplayName.MinLen {
		errs.Add("display_name", "too_short")
	}

	if length > v.Cfg.DisplayName.MaxLen {
		errs.Add("display_name", "too_long")
	}

	if !displayNameRe.MatchString(displayName) {
		errs.Add("display_name", "invalid")
	}
}

func (v *Validator) password(errs apivalid.Errors, password string) {
	length := utf8.RuneCountInString(password)

	if length == 0 {
		errs.Add("password", "required")
		return
	}

	if length < v.Cfg.Password.MinLen {
		errs.Add("password", "too_short")
	}

	if length > v.Cfg.Password.MaxLen {
		errs.Add("password", "too_long")
	}

	if !hasLower(password) {
		errs.Add("password", "must_contain_lower")
	}

	if !hasUpper(password) {
		errs.Add("password", "must_contain_upper")
	}

	if !hasDigit(password) {
		errs.Add("password", "must_contain_digit")
	}
}

func hasLower(s string) bool {
	for _, r := range s {
		if unicode.IsLower(r) {
			return true
		}
	}
	return false
}

func hasUpper(s string) bool {
	for _, r := range s {
		if unicode.IsUpper(r) {
			return true
		}
	}
	return false
}

func hasDigit(s string) bool {
	for _, r := range s {
		if unicode.IsDigit(r) {
			return true
		}
	}
	return false
}
