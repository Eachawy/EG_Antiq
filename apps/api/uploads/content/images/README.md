# Newsletter Images

This directory contains images used in newsletter email templates.

## Adding the Kemetra Logo

Place your `kemetraLogo.png` file in this directory.

The logo will be accessible at: `http://your-api-url/uploads/content/images/kemetraLogo.png`

## Usage in Newsletter Templates

In your HTML email template created in the admin panel, use:

```html
<img src="content/images/kemetraLogo.png" alt="Kemetra Logo" style="max-width: 200px;" />
```

Or with the uploads prefix:

```html
<img src="uploads/content/images/kemetraLogo.png" alt="Kemetra Logo" style="max-width: 200px;" />
```

The system will automatically convert these relative paths to absolute URLs when sending emails.

## Other Newsletter Images

You can add any other images needed for your newsletter templates to this directory.
