package com.fittrack.auth;

import com.fittrack.auth.dto.AuthResponse;
import com.fittrack.auth.dto.LoginRequest;
import com.fittrack.auth.dto.RegisterRequest;
import com.fittrack.exception.DuplicateEmailException;
import com.fittrack.user.Role;
import com.fittrack.user.User;
import com.fittrack.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    public AuthResponse register(RegisterRequest request, HttpServletResponse response) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateEmailException(request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();

        userRepository.save(user);

        issueJwtCookie(response, jwtService.generateToken(user));

        return AuthResponse.builder()
                .email(user.getEmail())
                .role(user.getRole().name())
                .message("Registration successful")
                .build();
    }

    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        // AuthenticationManager validates credentials; throws AuthenticationException on failure
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        issueJwtCookie(response, jwtService.generateToken(user));

        return AuthResponse.builder()
                .email(user.getEmail())
                .role(user.getRole().name())
                .message("Login successful")
                .build();
    }

    private void issueJwtCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)       // JS cannot read it — XSS protection
                .secure(cookieSecure) // false in dev (HTTP), true in prod (HTTPS)
                .path("/")
                .maxAge(Duration.ofDays(1))
                .sameSite("Strict")   // CSRF protection: cookie not sent on cross-site requests
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
