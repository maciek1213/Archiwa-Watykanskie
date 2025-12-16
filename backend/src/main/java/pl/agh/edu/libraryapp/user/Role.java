package pl.agh.edu.libraryapp.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

@Entity
@Table(name = "role")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "role name is required")
    private String roleName;

    public Role() {}

    public Role(String roleName) {
        this.roleName = roleName;
    }

    //settery i gettery
    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}
    public String getRoleName() {return roleName;}
    public void setRoleName(String roleName) {this.roleName = roleName;}
}

