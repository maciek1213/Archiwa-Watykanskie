package pl.agh.edu.libraryapp.bookItem;

public class BookItemNotFoundException extends RuntimeException {
    public BookItemNotFoundException(String message) {
        super(message);
    }
}