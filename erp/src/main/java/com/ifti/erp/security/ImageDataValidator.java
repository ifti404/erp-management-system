package com.ifti.erp.security;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.util.Base64;
import java.util.Iterator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class ImageDataValidator {
    private static final Pattern DATA_URL = Pattern.compile("^data:image/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$");
    private static final int MAX_BYTES = 2 * 1024 * 1024;

    private ImageDataValidator() {}

    public static String validate(String value) {
        if (value == null || value.isBlank()) return null;
        if (value.length() > 2_800_000) throw new IllegalArgumentException("Image must be 2 MB or smaller");
        Matcher matcher = DATA_URL.matcher(value);
        if (!matcher.matches()) throw new IllegalArgumentException("Upload a PNG or JPEG image");
        try {
            byte[] bytes = Base64.getDecoder().decode(matcher.group(2));
            if (bytes.length == 0 || bytes.length > MAX_BYTES) throw new IllegalArgumentException("Image must be 2 MB or smaller");
            try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
                if (!readers.hasNext()) throw new IllegalArgumentException("Upload a valid PNG or JPEG image");
                ImageReader reader = readers.next();
                try {
                    reader.setInput(input, true, true);
                    String actualFormat = reader.getFormatName().toLowerCase(java.util.Locale.ROOT);
                    String expectedFormat = matcher.group(1).equals("jpeg") ? "jpeg" : "png";
                    if (!actualFormat.equals(expectedFormat) || reader.getWidth(0) > 2048 || reader.getHeight(0) > 2048) {
                        throw new IllegalArgumentException("Image must be a valid PNG or JPEG no larger than 2048 × 2048 pixels");
                    }
                } finally { reader.dispose(); }
            }
            return value;
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalArgumentException("Upload a valid PNG or JPEG image");
        }
    }
}
