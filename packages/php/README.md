# now-php

## Usage

1. Create `index.php`

```php
<?php
phpinfo();
```

2. Create `now.json`

```json
{
  "version": 2,
  "builds": [
    { "src": "index.php", "use": "now-php" }
  ]
}
```

3. Call `now`
