# vercel-php

1. Create `api/index.php`.

	```php
	<?php
	phpinfo();
	```

2. Create `now.json`

	```json
	{
		"functions": {
			"api/index.php": {
				"runtime": "vercel-php@0.2.0"
			}
		}
	}
	```

3. Call `vercel`, `vc` or `now` and see magic.

4. Discover more in documentation at [Github repository](https://github.com/juicyfx/vercel-php).
