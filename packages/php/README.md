# now-php

1. Create `index.php`.

	```php
	<?php
	phpinfo();
	```

1. Create `now.json`

	```json
	{
		"functions": {
			"index.php": {
				"runtime": "now-php@0.0.6"
			},
			"api/*.php": {
				"runtime": "now-php@0.0.6"
			}
		}
	}
	```

3. Call `now` and see magic.

4. Discover more in documentation at [Github repository](https://github.com/juicyfx/now-php).
