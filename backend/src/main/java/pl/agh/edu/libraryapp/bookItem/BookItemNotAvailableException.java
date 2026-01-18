package pl.agh.edu.libraryapp.bookItem;

public class BookItemNotAvailableException extends RuntimeException {
    public BookItemNotAvailableException(String message) {
        super(message);
    }
}