package pl.agh.edu.libraryapp.book.exceptions;

public class RentalNotFoundException extends RuntimeException {
    public RentalNotFoundException(String message) {
        super(message);
    }
}