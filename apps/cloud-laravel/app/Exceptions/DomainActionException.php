<?php

namespace App\Exceptions;

use RuntimeException;

class DomainActionException extends RuntimeException
{
    protected int $status;
    protected array $context;

    public function __construct(string $message, int $status = 400, array $context = [])
    {
        parent::__construct($message);
        $this->status = $status;
        $this->context = $context;
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function getContext(): array
    {
        return $this->context;
    }
}
