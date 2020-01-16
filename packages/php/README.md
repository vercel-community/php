# now-php

1. Create `api/index.php`.

	```php
	<?php
	phpinfo();
	```

1. Create `now.json`

	```json
	{
		"functions": {
			"api/index.php": {
				"runtime": "now-php@0.0.9"
			}
		}
	}
	```

3. Call `now` and see magic.

4. Discover more in documentation at [Github repository](https://github.com/juicyfx/now-php).
