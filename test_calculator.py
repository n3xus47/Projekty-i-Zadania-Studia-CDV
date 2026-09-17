import pytest

from calculator import square

def main():
    test_square()

def test_square():
    assert square(3) == 9
    assert square(-5) == 25
    assert square(2) == 4
    assert square(0) == 0

def test_str():
    with pytest.raises(TypeError):
        square("chuj")



if __name__ == "__main__":
    main()