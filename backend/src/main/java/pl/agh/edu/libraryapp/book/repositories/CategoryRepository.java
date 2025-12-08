package pl.agh.edu.libraryapp.book.repositories;

import pl.agh.edu.libraryapp.book.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
}