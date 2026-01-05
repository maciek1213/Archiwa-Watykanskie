package pl.agh.edu.libraryapp.dto;

public record BookOutDto(Long id, Integer isbn, String title, String author, Integer count) {
}
