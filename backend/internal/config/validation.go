package config

type ValidationConfig struct {
	Video VideoValidationConfig `yaml:"video"`
	Auth  AuthValidationConfig  `yaml:"auth"`
}

type VideoValidationConfig struct {
	Title struct {
		MinLen int `yaml:"min_len"`
		MaxLen int `yaml:"max_len"`
	} `yaml:"title"`
	Upload struct {
		MinSize        int64    `yaml:"min_bytes"`
		MaxSize        int64    `yaml:"max_bytes"`
		AllowedContent []string `yaml:"allowed_content_types"`
	} `yaml:"upload"`
}

// auth validation

type AuthValidationConfig struct {
	Email struct {
		MinLen int `yaml:"min_len"`
		MaxLen int `yaml:"max_len"`
	} `yaml:"email"`

	DisplayName struct {
		MinLen int `yaml:"min_len"`
		MaxLen int `yaml:"max_len"`
	} `yaml:"display_name"`

	Password struct {
		MinLen int `yaml:"min_len"`
		MaxLen int `yaml:"max_len"`
	} `yaml:"password"`
}
