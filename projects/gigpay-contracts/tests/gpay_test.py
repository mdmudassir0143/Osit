from collections.abc import Iterator

import pytest
from algopy_testing import AlgopyTestContext, algopy_testing_context

from smart_contracts.gpay.contract import Gpay


@pytest.fixture()
def context() -> Iterator[AlgopyTestContext]:
    with algopy_testing_context() as ctx:
        yield ctx


def test_hello(context: AlgopyTestContext) -> None:
    # Arrange
    dummy_input = context.any.string(length=10)
    contract = Gpay()

    # Act
    output = contract.hello(dummy_input)

    # Assert
    assert output == f"Hello, {dummy_input}"
