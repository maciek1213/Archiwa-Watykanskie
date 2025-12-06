package pl.agh.edu.libraryapp.user;

public class UserNotFoundException extends RuntimeException{
    public UserNotFoundException(String username) {
        super(username);
    }
}
