package com.dams.backend.security;

import com.dams.backend.models.UserProfile;
import com.dams.backend.repositories.UserProfileRepository;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;
import java.util.List;
import java.util.ArrayList;
import java.util.Date;

@Component
public class FirebaseTokenFilter extends OncePerRequestFilter {

    private static final String ADMIN_EMAIL = "bandarunikitha97@gmail.com";
    private final UserProfileRepository userProfileRepository;

    public FirebaseTokenFilter(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                String uid = decodedToken.getUid();
                String email = decodedToken.getEmail();
                String name = decodedToken.getName();

                // Store or update real user email in MongoDB
                if (uid != null && email != null) {
                    try {
                        userProfileRepository.save(new UserProfile(uid, email, name, new Date()));
                    } catch (Exception ex) {
                        // ignore background profile sync error
                    }
                }
                
                List<GrantedAuthority> authorities = new ArrayList<>();
                if (email != null && ADMIN_EMAIL.equalsIgnoreCase(email)) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                }
                
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        uid, null, authorities);
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                System.out.println("Invalid Firebase Token: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
